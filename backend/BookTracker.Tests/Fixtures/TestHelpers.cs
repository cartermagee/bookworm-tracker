using System.Net.Http.Json;

using BookTracker.Api.Features.Books;
using BookTracker.Core.Entities;

namespace BookTracker.Tests.Fixtures;

/// <summary>
/// Test helpers shared across endpoint tests. Static methods take HttpClient as a parameter —
/// no shared state. See locked-decision memo item 5.
/// </summary>
public static class TestHelpers
{
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
        var book = await response.Content.ReadFromJsonAsync<BookDto>();
        return book ?? throw new InvalidOperationException("CreateBook returned no body");
    }
}
