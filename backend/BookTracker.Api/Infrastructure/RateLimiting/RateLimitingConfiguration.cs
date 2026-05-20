using System.Threading.RateLimiting;

using Microsoft.AspNetCore.RateLimiting;

namespace BookTracker.Api.Infrastructure.RateLimiting;

/// <summary>
/// Rate-limiter policies. The "auth" policy caps unauthenticated auth-endpoint hits at 5/min/IP
/// — see the master prompt §4 rate-limit row on /api/auth/register and /api/auth/login.
/// </summary>
public static class RateLimitingConfiguration
{
    public const string AuthPolicy = "auth";

    public static void Configure(RateLimiterOptions options)
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

        options.AddPolicy(AuthPolicy, httpContext =>
        {
            var key = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true,
            });
        });
    }
}
