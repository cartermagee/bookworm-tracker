using BookTracker.Core.Entities;

namespace BookTracker.Api.Features.Books;

public sealed record CreateBookRequest(
    string Title,
    string Author,
    string? Isbn,
    string? CoverUrl,
    string? OpenLibraryWorkId,
    BookStatus Status,
    int? Rating,
    string? Notes,
    DateTime? DateFinished);
