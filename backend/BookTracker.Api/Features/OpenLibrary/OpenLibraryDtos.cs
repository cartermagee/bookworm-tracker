namespace BookTracker.Api.Features.OpenLibrary;

/// <summary>One hit from the Open Library catalog search.</summary>
public sealed record OpenLibrarySearchResult(
    string WorkId,
    string Title,
    string Author,
    string? Isbn,
    string? CoverUrl,
    int? FirstPublishYear);

/// <summary>Detailed metadata for a single Open Library work.</summary>
public sealed record OpenLibraryBookMetadata(
    string WorkId,
    string Title,
    string Author,
    string? Isbn,
    string? CoverUrl,
    int? FirstPublishYear);
