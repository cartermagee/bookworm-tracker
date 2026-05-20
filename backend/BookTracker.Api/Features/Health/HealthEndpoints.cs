using BookTracker.Infrastructure.Persistence;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace BookTracker.Api.Features.Health;

/// <summary>/health endpoint — no auth, pokes the DB so a 200 actually means the DB is reachable.</summary>
public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/health", async (AppDbContext db, CancellationToken ct) =>
        {
            try
            {
                _ = await db.Database.CanConnectAsync(ct);
                return Results.Ok(new { status = "healthy", db = "ok" });
            }
            catch
            {
                return Results.Json(new { status = "unhealthy", db = "error" }, statusCode: StatusCodes.Status503ServiceUnavailable);
            }
        }).WithTags("Health");

        return app;
    }
}
