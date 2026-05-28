using BookTracker.Api.Infrastructure.RateLimiting;
using BookTracker.Core.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Routing;

namespace BookTracker.Api.Features.OpenLibrary;

/// <summary>/api/open-library endpoint group. Auth required at group level.</summary>
public static class OpenLibraryEndpoints
{
    public static IEndpointRouteBuilder MapOpenLibraryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/open-library")
            .WithTags("OpenLibrary")
            .RequireAuthorization();

        group.MapGet("/search", Search).RequireRateLimiting(RateLimitingConfiguration.AuthPolicy);
        group.MapGet("/{olid}", GetByOlid);

        return app;
    }

    private static async Task<Results<Ok<List<OpenLibrarySearchResult>>, ProblemHttpResult>> Search(
        string? q,
        int? limit,
        IBookMetadataService metadata,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q))
            return TypedResults.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Query parameter 'q' is required.",
                extensions: new Dictionary<string, object?> { ["errorCode"] = "MISSING_QUERY" });

        var results = await metadata.SearchAsync(q, limit ?? 10, ct);
        var dtos = results
            .Select(r => new OpenLibrarySearchResult(
                r.WorkId, r.Title, r.Author, r.Isbn, r.CoverUrl, r.FirstPublishYear))
            .ToList();
        return TypedResults.Ok(dtos);
    }

    private static async Task<Results<Ok<OpenLibraryBookMetadata>, ProblemHttpResult>> GetByOlid(
        string olid,
        IBookMetadataService metadata,
        CancellationToken ct)
    {
        var book = await metadata.GetByWorkIdAsync(olid, ct);
        if (book is null)
            return TypedResults.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Work not found.",
                extensions: new Dictionary<string, object?> { ["errorCode"] = "NOT_FOUND" });

        return TypedResults.Ok(new OpenLibraryBookMetadata(
            book.WorkId, book.Title, book.Author, book.Isbn, book.CoverUrl, book.FirstPublishYear));
    }
}
