using System.Text;
using System.Text.Json.Serialization;

using BookTracker.Api.Features.Auth;
using BookTracker.Api.Features.Books;
using BookTracker.Api.Features.Health;
using BookTracker.Api.Features.OpenLibrary;
using BookTracker.Api.Infrastructure.Auth;
using BookTracker.Api.Infrastructure.ProblemDetails;
using BookTracker.Api.Infrastructure.RateLimiting;
using BookTracker.Core.Abstractions;
using BookTracker.Infrastructure.OpenLibrary;
using BookTracker.Infrastructure.Persistence;

using FluentValidation;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

const string CorsPolicy = "frontend";

var builder = WebApplication.CreateBuilder(args);

// ──────────────────────────────────────────────────────────────────────────────
// Kestrel: HTTP only on localhost:5000 in dev. See locked-decision memo, item 1.
// ──────────────────────────────────────────────────────────────────────────────
builder.WebHost.ConfigureKestrel(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        options.ListenLocalhost(5000);
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// JWT secret: required, ≥32 bytes. Fail fast — see locked-decision memo, item 2.
// ──────────────────────────────────────────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret) || Encoding.UTF8.GetByteCount(jwtSecret) < 32)
{
    throw new InvalidOperationException(
        "Jwt:Secret is missing or shorter than 32 bytes. In dev set it via " +
        "`dotnet user-secrets set \"Jwt:Secret\" \"$(openssl rand -base64 64)\" --project BookTracker.Api`. " +
        "In prod set the Jwt__Secret environment variable. See README.");
}

// ──────────────────────────────────────────────────────────────────────────────
// FluentValidation key casing: camelCase to match JSON DTO field names.
// See locked-decision memo, item 6.
// ──────────────────────────────────────────────────────────────────────────────
ValidatorOptions.Global.PropertyNameResolver = (_, member, _) =>
{
    if (member is null)
    {
        return null;
    }
    var name = member.Name;
    return string.IsNullOrEmpty(name) ? name : char.ToLowerInvariant(name[0]) + name[1..];
};

// ──────────────────────────────────────────────────────────────────────────────
// EF Core + Identity. Single DbContext (locked-decision memo, item 7).
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlite(builder.Configuration.GetConnectionString("Default")));

builder.Services
    .AddIdentityCore<IdentityUser>(o =>
    {
        o.Password.RequireDigit = false;
        o.Password.RequireUppercase = false;
        o.Password.RequireLowercase = false;
        o.Password.RequireNonAlphanumeric = false;
        o.Password.RequiredLength = 8;
        o.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddSignInManager();

// ──────────────────────────────────────────────────────────────────────────────
// Auth: JwtBearer with the cookie events that lift the token out of the httpOnly cookie.
// See ADR-0006.
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.FromMinutes(1),
        };
        o.Events = new CookieJwtBearerEvents();
    });

builder.Services.AddAuthorization();

builder.Services.AddSingleton<JwtTokenService>();

// ──────────────────────────────────────────────────────────────────────────────
// FluentValidation: scan this assembly for AbstractValidator<T> types.
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// ──────────────────────────────────────────────────────────────────────────────
// ProblemDetails: every error response is application/problem+json (ADR-0010).
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.AddProblemDetails(o => o.CustomizeProblemDetails = ProblemDetailsConfiguration.Customize);
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// ──────────────────────────────────────────────────────────────────────────────
// CORS: explicit origin, credentials allowed. Never AllowAnyOrigin() (§2.4).
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.AddCors(o => o.AddPolicy(CorsPolicy, policy =>
{
    var origin = builder.Configuration["Cors:AllowedOrigin"] ?? "http://localhost:3000";
    policy.WithOrigins(origin)
          .AllowAnyHeader()
          .AllowAnyMethod()
          .AllowCredentials();
}));

// ──────────────────────────────────────────────────────────────────────────────
// Rate limiting: 5/min/IP on auth endpoints (master prompt §4).
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.AddRateLimiter(RateLimitingConfiguration.Configure);

// ──────────────────────────────────────────────────────────────────────────────
// Open Library client with Polly resilience (master prompt §3).
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.Configure<OpenLibraryOptions>(builder.Configuration.GetSection(OpenLibraryOptions.SectionName));
builder.Services.AddHttpClient<IBookMetadataService, OpenLibraryClient>((sp, client) =>
{
    var opts = sp.GetRequiredService<IOptions<OpenLibraryOptions>>().Value;
    client.BaseAddress = new Uri(opts.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(opts.TimeoutSeconds);
})
.AddStandardResilienceHandler();

// ──────────────────────────────────────────────────────────────────────────────
// JSON: serialize enums as strings on the wire (master prompt §4).
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase, allowIntegerValues: false));
});

// ──────────────────────────────────────────────────────────────────────────────
// OpenAPI / Swagger (ADR-0009 / §6).
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o =>
{
    o.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Bookworm Tracker API",
        Version = "v1",
        Description = "Personal book library / reading tracker. Single-user-per-account; multi-tenancy enforced server-side.",
    });
});

var app = builder.Build();

// ──────────────────────────────────────────────────────────────────────────────
// Pipeline: exception → ProblemDetails statuses → CORS → rate limiter → AuthN → AuthZ → endpoints.
// ──────────────────────────────────────────────────────────────────────────────
app.UseExceptionHandler();
app.UseStatusCodePages(); // 401/404 etc. become ProblemDetails.

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(CorsPolicy);
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthEndpoints();
app.MapAuthEndpoints();
app.MapBookEndpoints();
app.MapOpenLibraryEndpoints();

// Apply pending migrations on startup (dev). In prod the deployment pipeline runs `dotnet ef database update`.
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.Run();

// Expose Program so WebApplicationFactory<Program> can boot it from the test project.
public partial class Program;

/// <summary>
/// Catch-all exception handler. In dev the ex.Message lands in `detail`;
/// in prod it is suppressed (§2.1, ADR-0010).
/// </summary>
internal sealed class GlobalExceptionHandler(IHostEnvironment env, IProblemDetailsService problems) : IExceptionHandler
{
    private readonly IHostEnvironment _env = env;
    private readonly IProblemDetailsService _problems = problems;

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        var pd = new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Title = "An unexpected error occurred.",
            Status = StatusCodes.Status500InternalServerError,
            Type = "https://datatracker.ietf.org/doc/html/rfc7807",
            Detail = _env.IsDevelopment() ? exception.Message : null,
        };
        pd.Extensions["traceId"] = httpContext.TraceIdentifier;

        return await _problems.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = pd,
            Exception = exception,
        });
    }
}
