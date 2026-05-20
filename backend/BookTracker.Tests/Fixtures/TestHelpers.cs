using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

using BookTracker.Api.Features.Books;
using BookTracker.Core.Entities;

namespace BookTracker.Tests.Fixtures;

/// <summary>
/// Test helpers shared across endpoint tests. Static methods take HttpClient as a parameter —
/// no shared state. See locked-decision memo item 5.
/// </summary>
public static class TestHelpers
{
    // Match the API's JSON options: camelCase properties + camelCase string enums.
    // Required because the API serialises BookStatus as "wantToRead" etc. and
    // HttpClient.ReadFromJsonAsync uses default options (no custom enum converter) otherwise.
    private static readonly JsonSerializerOptions ApiJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    public static async Task Register(HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/register", new { email, password });
        response.EnsureSuccessStatusCode();
    }

    public static async Task Login(HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        response.EnsureSuccessStatusCode();
    }

    public static async Task<BookDto> CreateBook(HttpClient client, string title)
    {
        var request = new
        {
            title,
            author = "Test Author",
            status = nameof(BookStatus.WantToRead),
        };
        var response = await client.PostAsJsonAsync("/api/books", request);
        response.EnsureSuccessStatusCode();
        var book = await response.Content.ReadFromJsonAsync<BookDto>(ApiJsonOptions);
        return book ?? throw new InvalidOperationException("CreateBook returned no body");
    }
}
