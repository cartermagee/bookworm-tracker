namespace BookTracker.Core.Abstractions;

/// <summary>
/// Abstraction for an external book-metadata source (e.g., Open Library).
/// Lives in Core to keep the Api layer decoupled from infrastructure choices — see ADR-0002.
/// </summary>
public interface IBookMetadataService
{
    /// <summary>
    /// Search the upstream catalog for books matching the given query.
    /// </summary>
    Task<IReadOnlyList<BookMetadataSearchResult>> SearchAsync(string query, int limit, CancellationToken cancellationToken);

    /// <summary>
    /// Fetch a single book's metadata by its upstream work identifier.
    /// </summary>
    Task<BookMetadata?> GetByWorkIdAsync(string workId, CancellationToken cancellationToken);
}

/// <summary>One search hit from the metadata source.</summary>
public sealed record BookMetadataSearchResult(
    string WorkId,
    string Title,
    string Author,
    string? Isbn,
    string? CoverUrl,
    int? FirstPublishYear);

/// <summary>Detailed metadata for a single book.</summary>
public sealed record BookMetadata(
    string WorkId,
    string Title,
    string Author,
    string? Isbn,
    string? CoverUrl,
    int? FirstPublishYear);
