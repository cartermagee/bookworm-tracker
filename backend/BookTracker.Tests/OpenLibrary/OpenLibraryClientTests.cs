using System.Net;
using System.Text;

using BookTracker.Infrastructure.OpenLibrary;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Xunit;

namespace BookTracker.Tests.OpenLibrary;

/// <summary>
/// Unit tests for <see cref="OpenLibraryClient"/> using a manual fake
/// <see cref="HttpMessageHandler"/> — no network calls, no WebApplicationFactory.
/// </summary>
public class OpenLibraryClientTests
{
    private static HttpClient CreateClient(Func<HttpRequestMessage, HttpResponseMessage> handler) =>
        new(new FakeHttpMessageHandler(handler))
        {
            BaseAddress = new Uri("https://openlibrary.org"),
        };

    private static HttpResponseMessage JsonOk(string json) =>
        new(HttpStatusCode.OK)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json"),
        };

    [Fact]
    public async Task SearchAsync_returns_mapped_results()
    {
        const string json = """
            {
                "docs": [
                    {
                        "key": "/works/OL123W",
                        "title": "Dune",
                        "author_name": ["Frank Herbert"],
                        "isbn": ["0441013597"],
                        "cover_i": 12345,
                        "first_publish_year": 1965
                    }
                ]
            }
            """;

        var sut = new OpenLibraryClient(CreateClient(_ => JsonOk(json)), NullLogger<OpenLibraryClient>.Instance);

        var results = await sut.SearchAsync("Dune", 10, CancellationToken.None);

        results.Should().HaveCount(1);
        results[0].WorkId.Should().Be("OL123W");
        results[0].Title.Should().Be("Dune");
        results[0].Author.Should().Be("Frank Herbert");
        results[0].CoverUrl.Should().Contain("12345");
        results[0].FirstPublishYear.Should().Be(1965);
    }

    [Fact]
    public async Task SearchAsync_with_empty_results_returns_empty_list()
    {
        const string json = """{"docs": []}""";

        var sut = new OpenLibraryClient(CreateClient(_ => JsonOk(json)), NullLogger<OpenLibraryClient>.Instance);

        var results = await sut.SearchAsync("nonexistent title xyz", 10, CancellationToken.None);

        results.Should().BeEmpty();
    }

    [Fact]
    public async Task GetByWorkIdAsync_returns_mapped_metadata()
    {
        var responses = new Dictionary<string, string>
        {
            ["/works/OL123W.json"] = """{"key": "/works/OL123W", "title": "Dune"}""",
            ["/works/OL123W/editions.json?limit=1"] = """
                {
                    "entries": [
                        {
                            "authors": [{"key": "/authors/OL1A"}],
                            "isbn_13": ["9780441013593"],
                            "covers": [99999]
                        }
                    ]
                }
                """,
            ["/authors/OL1A.json"] = """{"name": "Frank Herbert"}""",
        };

        var client = CreateClient(req =>
        {
            var path = req.RequestUri!.PathAndQuery;
            return responses.TryGetValue(path, out var body)
                ? JsonOk(body)
                : new HttpResponseMessage(HttpStatusCode.NotFound);
        });

        var sut = new OpenLibraryClient(client, NullLogger<OpenLibraryClient>.Instance);

        var result = await sut.GetByWorkIdAsync("OL123W", CancellationToken.None);

        result.Should().NotBeNull();
        result!.WorkId.Should().Be("OL123W");
        result.Title.Should().Be("Dune");
        result.Author.Should().Be("Frank Herbert");
        result.Isbn.Should().Be("9780441013593");
        result.CoverUrl.Should().Contain("99999");
    }

    [Fact]
    public async Task GetByWorkIdAsync_not_found_returns_null()
    {
        var sut = new OpenLibraryClient(
            CreateClient(_ => new HttpResponseMessage(HttpStatusCode.NotFound)),
            NullLogger<OpenLibraryClient>.Instance);

        var result = await sut.GetByWorkIdAsync("MISSING", CancellationToken.None);

        result.Should().BeNull();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private sealed class FakeHttpMessageHandler(
        Func<HttpRequestMessage, HttpResponseMessage> handler) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(handler(request));
    }
}
