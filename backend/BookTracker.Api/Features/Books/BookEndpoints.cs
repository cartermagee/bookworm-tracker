using BookTracker.Api.Infrastructure.Validation;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace BookTracker.Api.Features.Books;

/// <summary>
/// /api/books endpoint group. All endpoints require auth — applied once at the group level
/// so any new endpoint inherits it. See master prompt §2.11. Phase 1: handlers stub with 501.
/// </summary>
public static class BookEndpoints
{
    public static IEndpointRouteBuilder MapBookEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/books")
            .WithTags("Books")
            .RequireAuthorization();

        group.MapGet("/", List);
        group.MapGet("/{id:guid}", GetById);
        group.MapPost("/", Create).AddEndpointFilter<ValidationFilter<CreateBookRequest>>();
        group.MapPut("/{id:guid}", Update).AddEndpointFilter<ValidationFilter<UpdateBookRequest>>();
        group.MapDelete("/{id:guid}", Delete);

        return app;
    }

    private static ProblemHttpResult List() => NotImplemented();
    private static ProblemHttpResult GetById(Guid id) => NotImplemented();
    private static ProblemHttpResult Create(CreateBookRequest request) => NotImplemented();
    private static ProblemHttpResult Update(Guid id, UpdateBookRequest request) => NotImplemented();
    private static ProblemHttpResult Delete(Guid id) => NotImplemented();

    private static ProblemHttpResult NotImplemented() =>
        TypedResults.Problem(
            title: "Not Implemented",
            statusCode: StatusCodes.Status501NotImplemented,
            extensions: new Dictionary<string, object?> { ["errorCode"] = "NOT_IMPLEMENTED" });
}
