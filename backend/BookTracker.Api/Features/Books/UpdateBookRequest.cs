using BookTracker.Core.Entities;

namespace BookTracker.Api.Features.Books;

/// <summary>
/// Full-replacement update payload. Identical shape to <see cref="CreateBookRequest"/>;
/// declared as a distinct type so the OpenAPI schema and FluentValidation registration
/// stay independent.
/// </summary>
public sealed record UpdateBookRequest(
    string Title,
    string Author,
    string? Isbn,
    string? CoverUrl,
    string? OpenLibraryWorkId,
    BookStatus Status,
    int? Rating,
    string? Notes,
    DateTime? DateFinished);
