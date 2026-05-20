using BookTracker.Api.Infrastructure.RateLimiting;
using BookTracker.Api.Infrastructure.Validation;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Routing;

namespace BookTracker.Api.Features.Auth;

/// <summary>
/// /api/auth endpoint group. Phase 1: all handlers stub with 501. Phase 2 wires Identity + JwtTokenService.
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

    private static ProblemHttpResult Register(RegisterRequest request)
        => NotImplemented();

    private static ProblemHttpResult Login(LoginRequest request)
        => NotImplemented();

    private static ProblemHttpResult Logout()
        => NotImplemented();

    private static ProblemHttpResult Me()
        => NotImplemented();

    private static ProblemHttpResult NotImplemented() =>
        TypedResults.Problem(
            title: "Not Implemented",
            statusCode: StatusCodes.Status501NotImplemented,
            extensions: new Dictionary<string, object?> { ["errorCode"] = "NOT_IMPLEMENTED" });
}
