using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

using BookTracker.Api.Infrastructure.Auth;
using BookTracker.Api.Infrastructure.RateLimiting;
using BookTracker.Api.Infrastructure.Validation;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Routing;
using Microsoft.IdentityModel.Tokens;

namespace BookTracker.Api.Features.Auth;

/// <summary>
/// /api/auth endpoint group. Phase 2: real Identity + JwtTokenService implementations.
/// Group-level rate limiting on register/login (5/min/IP) — see master prompt §4.
/// </summary>
public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/register", Register)
            .AddEndpointFilter<ValidationFilter<RegisterRequest>>()
            .RequireRateLimiting(RateLimitingConfiguration.AuthPolicy);

        group.MapPost("/login", Login)
            .AddEndpointFilter<ValidationFilter<LoginRequest>>()
            .RequireRateLimiting(RateLimitingConfiguration.AuthPolicy);

        group.MapPost("/logout", Logout);

        group.MapPost("/refresh", Refresh)
            .RequireRateLimiting(RateLimitingConfiguration.AuthPolicy);

        group.MapGet("/me", Me).RequireAuthorization();

        return app;
    }

    private static async Task<Results<Created, ProblemHttpResult>> Register(
        RegisterRequest request,
        UserManager<IdentityUser> userManager,
        JwtTokenService jwtService,
        HttpContext httpContext,
        IHostEnvironment env)
    {
        // Email uniqueness — checked here, NOT in the validator (§2.2 / ADR-0011)
        if (await userManager.FindByEmailAsync(request.Email) is not null)
            return TypedResults.Problem(
                title: "Email already registered.",
                statusCode: StatusCodes.Status409Conflict,
                extensions: new Dictionary<string, object?> { ["errorCode"] = "EMAIL_TAKEN" });

        var user = new IdentityUser { Email = request.Email, UserName = request.Email };
        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return TypedResults.Problem(
                title: result.Errors.First().Description,
                statusCode: StatusCodes.Status400BadRequest,
                extensions: new Dictionary<string, object?> { ["errorCode"] = "REGISTRATION_FAILED" });

        // Auto-login: issue cookie immediately after registration
        AppendAuthCookie(httpContext, jwtService.Create(user), env);
        return TypedResults.Created();  // 201, no body
    }

    private static async Task<Results<NoContent, ProblemHttpResult>> Login(
        LoginRequest request,
        UserManager<IdentityUser> userManager,
        SignInManager<IdentityUser> signInManager,
        JwtTokenService jwtService,
        HttpContext httpContext,
        IHostEnvironment env)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
            return InvalidCredentials();

        var check = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (!check.Succeeded)
            return InvalidCredentials();

        AppendAuthCookie(httpContext, jwtService.Create(user), env);
        return TypedResults.NoContent();  // 204

        static ProblemHttpResult InvalidCredentials() =>
            TypedResults.Problem(
                title: "Invalid email or password.",
                statusCode: StatusCodes.Status401Unauthorized,
                extensions: new Dictionary<string, object?> { ["errorCode"] = "INVALID_CREDENTIALS" });
    }

    private static NoContent Logout(HttpContext httpContext)
    {
        httpContext.Response.Cookies.Delete(CookieJwtBearerEvents.CookieName);
        return TypedResults.NoContent();  // 204
    }

    private static Results<Ok<MeResponse>, ProblemHttpResult> Me(ClaimsPrincipal user)
    {
        var id = user.FindFirstValue(ClaimTypes.NameIdentifier);
        var email = user.FindFirstValue(ClaimTypes.Email);
        if (id is null || email is null)
            return TypedResults.Problem(statusCode: 401, title: "Not authenticated.",
                extensions: new Dictionary<string, object?> { ["errorCode"] = "UNAUTHENTICATED" });
        return TypedResults.Ok(new MeResponse(id, email));
    }

    private static async Task<Results<NoContent, UnauthorizedHttpResult>> Refresh(
        HttpContext httpContext,
        UserManager<IdentityUser> userManager,
        JwtTokenService jwtService,
        IHostEnvironment env,
        IConfiguration configuration)
    {
        // Read the existing token from the httpOnly cookie — do not trust Authorization header.
        if (!httpContext.Request.Cookies.TryGetValue(CookieJwtBearerEvents.CookieName, out var token)
            || string.IsNullOrEmpty(token))
            return TypedResults.Unauthorized();

        // Validate signature, issuer, and audience — but NOT lifetime (that's the point).
        var secret = configuration["Jwt:Secret"];
        if (string.IsNullOrEmpty(secret))
            return TypedResults.Unauthorized();

        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = configuration["Jwt:Issuer"] ?? "BookTracker",
            ValidateAudience = true,
            ValidAudience = configuration["Jwt:Audience"] ?? "BookTracker",
            ValidateLifetime = false,   // allow expired tokens — that's the whole point
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ClockSkew = TimeSpan.FromMinutes(1),
        };

        ClaimsPrincipal principal;
        try
        {
            principal = new JwtSecurityTokenHandler().ValidateToken(token, validationParameters, out _);
        }
        catch
        {
            // Tampered, wrong issuer, wrong key — reject.
            return TypedResults.Unauthorized();
        }

        // Extract user ID from the sub claim.
        var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return TypedResults.Unauthorized();

        // Verify the user still exists and is not locked out.
        var user = await userManager.FindByIdAsync(userId);
        if (user is null || await userManager.IsLockedOutAsync(user))
            return TypedResults.Unauthorized();

        // Issue a fresh token in the same httpOnly cookie.
        AppendAuthCookie(httpContext, jwtService.Create(user), env);
        return TypedResults.NoContent();
    }

    private static void AppendAuthCookie(HttpContext httpContext, string token, IHostEnvironment env)
    {
        // Secure = false in Development so the httpOnly cookie works over plain HTTP (locked-decision §1).
        // Secure = true in Production. SameSite=Lax in both.
        httpContext.Response.Cookies.Append(
            CookieJwtBearerEvents.CookieName,
            token,
            new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Secure = !env.IsDevelopment(),
                Expires = DateTimeOffset.UtcNow.AddHours(1),
            });
    }
}
