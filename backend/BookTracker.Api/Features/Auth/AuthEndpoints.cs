using System.Security.Claims;

using BookTracker.Api.Infrastructure.Auth;
using BookTracker.Api.Infrastructure.RateLimiting;
using BookTracker.Api.Infrastructure.Validation;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Routing;

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

        group.MapGet("/me", Me).RequireAuthorization();

        return app;
    }

    private static async Task<IResult> Register(
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

    private static async Task<IResult> Login(
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

        var check = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false);
        if (!check.Succeeded)
            return InvalidCredentials();

        AppendAuthCookie(httpContext, jwtService.Create(user), env);
        return TypedResults.NoContent();  // 204

        static IResult InvalidCredentials() =>
            TypedResults.Problem(
                title: "Invalid email or password.",
                statusCode: StatusCodes.Status401Unauthorized,
                extensions: new Dictionary<string, object?> { ["errorCode"] = "INVALID_CREDENTIALS" });
    }

    private static IResult Logout(HttpContext httpContext)
    {
        httpContext.Response.Cookies.Delete(CookieJwtBearerEvents.CookieName);
        return TypedResults.NoContent();  // 204
    }

    private static IResult Me(ClaimsPrincipal user)
    {
        var id = user.FindFirstValue(ClaimTypes.NameIdentifier);
        var email = user.FindFirstValue(ClaimTypes.Email);
        if (id is null || email is null)
            return TypedResults.Problem(statusCode: 401, title: "Not authenticated.",
                extensions: new Dictionary<string, object?> { ["errorCode"] = "UNAUTHENTICATED" });
        return TypedResults.Ok(new MeResponse(id, email));
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
