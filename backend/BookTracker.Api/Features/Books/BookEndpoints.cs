using System.Security.Claims;

using BookTracker.Api.Infrastructure.Validation;
using BookTracker.Core.Entities;
using BookTracker.Infrastructure.Persistence;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace BookTracker.Api.Features.Books;

/// <summary>
/// /api/books endpoint group. All endpoints require auth — applied once at the group level
/// so any new endpoint inherits it. See master prompt §2.11.
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

    private static async Task<IResult> List(
        ClaimsPrincipal user,
        AppDbContext db,
        CancellationToken ct)
    {
        var userId = GetUserId(user);
        var books = await db.Books
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.DateAdded)
            .ToListAsync(ct);
        return TypedResults.Ok(books.Select(ToDto).ToList());
    }

    private static async Task<IResult> GetById(
        Guid id,
        ClaimsPrincipal user,
        AppDbContext db,
        CancellationToken ct)
    {
        var userId = GetUserId(user);
        var book = await db.Books.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId, ct);
        return book is null
            ? TypedResults.Problem(statusCode: 404, title: "Book not found.",
                extensions: new Dictionary<string, object?> { ["errorCode"] = "NOT_FOUND" })
            : TypedResults.Ok(ToDto(book));
    }

    private static async Task<IResult> Create(
        CreateBookRequest request,
        ClaimsPrincipal user,
        AppDbContext db,
        CancellationToken ct)
    {
        var userId = GetUserId(user);
        var book = new Book
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = request.Title,
            Author = request.Author,
            Isbn = request.Isbn,
            CoverUrl = request.CoverUrl,
            OpenLibraryWorkId = request.OpenLibraryWorkId,
            Status = request.Status,
            Rating = request.Rating,
            Notes = request.Notes,
            DateAdded = DateTime.UtcNow,
            DateFinished = request.DateFinished,
        };
        db.Books.Add(book);
        await db.SaveChangesAsync(ct);
        return TypedResults.Created($"/api/books/{book.Id}", ToDto(book));
    }

    private static async Task<IResult> Update(
        Guid id,
        UpdateBookRequest request,
        ClaimsPrincipal user,
        AppDbContext db,
        CancellationToken ct)
    {
        var userId = GetUserId(user);
        var book = await db.Books.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId, ct);
        if (book is null)
            return TypedResults.Problem(statusCode: 404, title: "Book not found.",
                extensions: new Dictionary<string, object?> { ["errorCode"] = "NOT_FOUND" });

        book.Title = request.Title;
        book.Author = request.Author;
        book.Isbn = request.Isbn;
        book.CoverUrl = request.CoverUrl;
        book.OpenLibraryWorkId = request.OpenLibraryWorkId;
        book.Status = request.Status;
        book.Rating = request.Rating;
        book.Notes = request.Notes;
        book.DateFinished = request.DateFinished;

        await db.SaveChangesAsync(ct);
        return TypedResults.Ok(ToDto(book));
    }

    private static async Task<IResult> Delete(
        Guid id,
        ClaimsPrincipal user,
        AppDbContext db,
        CancellationToken ct)
    {
        var userId = GetUserId(user);
        var book = await db.Books.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId, ct);
        if (book is null)
            return TypedResults.Problem(statusCode: 404, title: "Book not found.",
                extensions: new Dictionary<string, object?> { ["errorCode"] = "NOT_FOUND" });

        db.Books.Remove(book);
        await db.SaveChangesAsync(ct);
        return TypedResults.NoContent();
    }

    private static string GetUserId(ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("ClaimTypes.NameIdentifier missing from JWT claims.");

    private static BookDto ToDto(Book book) => new(
        book.Id, book.Title, book.Author, book.Isbn, book.CoverUrl, book.OpenLibraryWorkId,
        book.Status, book.Rating, book.Notes, book.DateAdded, book.DateFinished);
}
