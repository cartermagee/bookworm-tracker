using BookTracker.Core.Entities;

namespace BookTracker.Api.Features.Books;

/// <summary>Wire-format representation of a <see cref="Book"/>.</summary>
public sealed record BookDto(
    Guid Id,
    string Title,
    string Author,
    string? Isbn,
    string? CoverUrl,
    string? OpenLibraryWorkId,
    BookStatus Status,
    int? Rating,
    string? Notes,
    DateTime DateAdded,
    DateTime? DateFinished);
