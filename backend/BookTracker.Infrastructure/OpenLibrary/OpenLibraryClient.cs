using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using BookTracker.Core.Abstractions;
using Microsoft.Extensions.Logging;

namespace BookTracker.Infrastructure.OpenLibrary;

/// <summary>
/// HTTP client for Open Library, implementing <see cref="IBookMetadataService"/>.
/// Polly standard resilience (retry + timeout) is registered on the HttpClient in the host.
/// </summary>
public sealed class OpenLibraryClient(HttpClient httpClient, ILogger<OpenLibraryClient> logger) : IBookMetadataService
{
    private readonly HttpClient _httpClient = httpClient;
    private readonly ILogger<OpenLibraryClient> _logger = logger;

    public async Task<IReadOnlyList<BookMetadataSearchResult>> SearchAsync(
        string query, int limit, CancellationToken cancellationToken)
    {
        var url = $"/search.json?q={Uri.EscapeDataString(query)}&limit={limit}&fields=key,title,author_name,isbn,cover_i,first_publish_year";
        var response = await _httpClient.GetFromJsonAsync<OlSearchResponse>(url, cancellationToken: cancellationToken);
        if (response?.Docs is null) return Array.Empty<BookMetadataSearchResult>();

        return response.Docs
            .Select(doc => new BookMetadataSearchResult(
                WorkId: doc.Key?.Replace("/works/", string.Empty, StringComparison.Ordinal) ?? string.Empty,
                Title: doc.Title ?? string.Empty,
                Author: doc.AuthorName?.FirstOrDefault() ?? "Unknown",
                Isbn: doc.Isbn?.FirstOrDefault(),
                CoverUrl: doc.CoverId.HasValue ? $"https://covers.openlibrary.org/b/id/{doc.CoverId}-M.jpg" : null,
                FirstPublishYear: doc.FirstPublishYear))
            .Where(r => !string.IsNullOrEmpty(r.WorkId))
            .ToList()
            .AsReadOnly();
    }

    public async Task<BookMetadata?> GetByWorkIdAsync(
        string workId, CancellationToken cancellationToken)
    {
        var workResponse = await _httpClient.GetAsync($"/works/{workId}.json", cancellationToken);
        if (workResponse.StatusCode == HttpStatusCode.NotFound) return null;
        workResponse.EnsureSuccessStatusCode();

        var work = await workResponse.Content.ReadFromJsonAsync<OlWorkResponse>(cancellationToken: cancellationToken);
        if (work is null) return null;

        // Best-effort: try to pull author/isbn/cover from the first edition
        string? author = null;
        string? isbn = null;
        string? coverUrl = null;

        try
        {
            var editions = await _httpClient.GetFromJsonAsync<OlEditionsResponse>(
                $"/works/{workId}/editions.json?limit=1", cancellationToken: cancellationToken);
            var ed = editions?.Entries?.FirstOrDefault();
            if (ed is not null)
            {
                var authorKey = ed.Authors?.FirstOrDefault()?.Key;
                if (authorKey is not null)
                    author = await GetAuthorNameAsync(authorKey, cancellationToken);

                isbn = ed.Isbn13?.FirstOrDefault() ?? ed.Isbn10?.FirstOrDefault();

                var coverId = ed.Covers?.FirstOrDefault(id => id > 0);
                coverUrl = coverId.HasValue ? $"https://covers.openlibrary.org/b/id/{coverId}-M.jpg" : null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch editions for work {WorkId}; returning partial metadata", workId);
        }

        return new BookMetadata(
            WorkId: workId,
            Title: work.Title ?? string.Empty,
            Author: author ?? "Unknown",
            Isbn: isbn,
            CoverUrl: coverUrl,
            FirstPublishYear: null);
    }

    private async Task<string?> GetAuthorNameAsync(string authorKey, CancellationToken ct)
    {
        try
        {
            var author = await _httpClient.GetFromJsonAsync<OlAuthorResponse>(
                $"{authorKey}.json", cancellationToken: ct);
            return author?.Name;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch author name for key {AuthorKey}", authorKey);
            return null;
        }
    }

    // ── Private DTOs for JSON deserialization ──────────────────────────────────

    private sealed class OlSearchResponse
    {
        [JsonPropertyName("docs")]
        public List<OlSearchDoc>? Docs { get; set; }
    }

    private sealed class OlSearchDoc
    {
        [JsonPropertyName("key")]
        public string? Key { get; set; }

        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("author_name")]
        public List<string>? AuthorName { get; set; }

        [JsonPropertyName("isbn")]
        public List<string>? Isbn { get; set; }

        [JsonPropertyName("cover_i")]
        public int? CoverId { get; set; }

        [JsonPropertyName("first_publish_year")]
        public int? FirstPublishYear { get; set; }
    }

    private sealed class OlWorkResponse
    {
        [JsonPropertyName("key")]
        public string? Key { get; set; }

        [JsonPropertyName("title")]
        public string? Title { get; set; }
    }

    private sealed class OlEditionsResponse
    {
        [JsonPropertyName("entries")]
        public List<OlEdition>? Entries { get; set; }
    }

    private sealed class OlEdition
    {
        [JsonPropertyName("authors")]
        public List<OlAuthorRef>? Authors { get; set; }

        [JsonPropertyName("isbn_13")]
        public List<string>? Isbn13 { get; set; }

        [JsonPropertyName("isbn_10")]
        public List<string>? Isbn10 { get; set; }

        [JsonPropertyName("covers")]
        public List<int>? Covers { get; set; }
    }

    private sealed class OlAuthorRef
    {
        [JsonPropertyName("key")]
        public string? Key { get; set; }
    }

    private sealed class OlAuthorResponse
    {
        [JsonPropertyName("name")]
        public string? Name { get; set; }
    }
}
