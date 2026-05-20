using BookTracker.Core.Abstractions;

namespace BookTracker.Infrastructure.OpenLibrary;

/// <summary>
/// HTTP client for Open Library, implementing <see cref="IBookMetadataService"/>.
/// Phase 1: stub implementation that throws <see cref="NotImplementedException"/>.
/// Phase 2: real search and work-id lookup against openlibrary.org with Polly retries (registered in the host).
/// </summary>
public sealed class OpenLibraryClient(HttpClient httpClient) : IBookMetadataService
{
    private readonly HttpClient _httpClient = httpClient;

    public Task<IReadOnlyList<BookMetadataSearchResult>> SearchAsync(string query, int limit, CancellationToken cancellationToken)
        => throw new NotImplementedException("Phase 2 — OpenLibraryClient.SearchAsync");

    public Task<BookMetadata?> GetByWorkIdAsync(string workId, CancellationToken cancellationToken)
        => throw new NotImplementedException("Phase 2 — OpenLibraryClient.GetByWorkIdAsync");
}
