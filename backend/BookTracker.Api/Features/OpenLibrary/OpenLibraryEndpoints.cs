using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace BookTracker.Api.Features.OpenLibrary;

/// <summary>/api/open-library endpoint group. Auth required. Phase 1 stubs.</summary>
public static class OpenLibraryEndpoints
{
    public static IEndpointRouteBuilder MapOpenLibraryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/open-library")
            .WithTags("OpenLibrary")
            .RequireAuthorization();

        group.MapGet("/search", Search);
        group.MapGet("/{olid}", GetByOlid);

        return app;
    }

    private static ProblemHttpResult Search(string? q, int? limit) => NotImplemented();
    private static ProblemHttpResult GetByOlid(string olid) => NotImplemented();

    private static ProblemHttpResult NotImplemented() =>
        TypedResults.Problem(
            title: "Not Implemented",
            statusCode: StatusCodes.Status501NotImplemented,
            extensions: new Dictionary<string, object?> { ["errorCode"] = "NOT_IMPLEMENTED" });
}
