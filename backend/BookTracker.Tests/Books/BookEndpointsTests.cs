using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

using BookTracker.Api.Features.Books;
using BookTracker.Tests.Fixtures;

using FluentAssertions;

using Xunit;

namespace BookTracker.Tests.Books;

/// <summary>
/// Integration tests for /api/books endpoints: CRUD and multi-tenancy.
/// Each test creates its own ApiFactory so the in-process rate-limiter bucket
/// resets between tests (the limiter keys on RemoteIpAddress, which is always
/// 127.0.0.1 for WebApplicationFactory clients — a shared factory would exhaust
/// the 5/min cap on the auth endpoints).
/// </summary>
public class BookEndpointsTests
{
    private static readonly JsonSerializerOptions ApiJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    [Fact]
    public async Task List_returns_empty_for_new_user()
    {
        await using var factory = new ApiFactory();
        var client = factory.CreateClient();
        await TestHelpers.Register(client, "list-empty@example.com", "P@ssw0rd!");
        await TestHelpers.Login(client, "list-empty@example.com", "P@ssw0rd!");

        var response = await client.GetAsync("/api/books");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var books = await response.Content.ReadFromJsonAsync<List<BookDto>>(ApiJsonOptions);
        books.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public async Task Create_returns_201_with_location_header()
    {
        await using var factory = new ApiFactory();
        var client = factory.CreateClient();
        await TestHelpers.Register(client, "create-201@example.com", "P@ssw0rd!");
        await TestHelpers.Login(client, "create-201@example.com", "P@ssw0rd!");

        var response = await client.PostAsJsonAsync("/api/books", new
        {
            title = "Test Book",
            author = "Test Author",
            status = "wantToRead",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();
        var book = await response.Content.ReadFromJsonAsync<BookDto>(ApiJsonOptions);
        book.Should().NotBeNull();
        book!.Id.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public async Task Create_invalid_missing_title_returns_400()
    {
        await using var factory = new ApiFactory();
        var client = factory.CreateClient();
        await TestHelpers.Register(client, "create-400@example.com", "P@ssw0rd!");
        await TestHelpers.Login(client, "create-400@example.com", "P@ssw0rd!");

        var response = await client.PostAsJsonAsync("/api/books", new
        {
            title = "",
            author = "Test Author",
            status = "wantToRead",
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetById_returns_book()
    {
        await using var factory = new ApiFactory();
        var client = factory.CreateClient();
        await TestHelpers.Register(client, "getbyid@example.com", "P@ssw0rd!");
        await TestHelpers.Login(client, "getbyid@example.com", "P@ssw0rd!");
        var created = await TestHelpers.CreateBook(client, "My Book");

        var response = await client.GetAsync($"/api/books/{created.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var book = await response.Content.ReadFromJsonAsync<BookDto>(ApiJsonOptions);
        book.Should().NotBeNull();
        book!.Id.Should().Be(created.Id);
        book.Title.Should().Be("My Book");
    }

    [Fact]
    public async Task GetById_wrong_user_returns_404()
    {
        await using var factory = new ApiFactory();
        var clientA = factory.CreateClient();
        var clientB = factory.CreateClient();

        await TestHelpers.Register(clientA, "getbyid-a@example.com", "P@ssw0rd!");
        await TestHelpers.Login(clientA, "getbyid-a@example.com", "P@ssw0rd!");
        var bookA = await TestHelpers.CreateBook(clientA, "A's Book");

        await TestHelpers.Register(clientB, "getbyid-b@example.com", "P@ssw0rd!");
        await TestHelpers.Login(clientB, "getbyid-b@example.com", "P@ssw0rd!");

        var response = await clientB.GetAsync($"/api/books/{bookA.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Update_changes_fields()
    {
        await using var factory = new ApiFactory();
        var client = factory.CreateClient();
        await TestHelpers.Register(client, "update@example.com", "P@ssw0rd!");
        await TestHelpers.Login(client, "update@example.com", "P@ssw0rd!");
        var created = await TestHelpers.CreateBook(client, "Original Title");

        var updateResponse = await client.PutAsJsonAsync($"/api/books/{created.Id}", new
        {
            title = "Updated Title",
            author = "Updated Author",
            status = "reading",
        });
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var getResponse = await client.GetAsync($"/api/books/{created.Id}");
        var book = await getResponse.Content.ReadFromJsonAsync<BookDto>(ApiJsonOptions);
        book.Should().NotBeNull();
        book!.Title.Should().Be("Updated Title");
        book.Author.Should().Be("Updated Author");
    }

    [Fact]
    public async Task Update_wrong_user_returns_404()
    {
        await using var factory = new ApiFactory();
        var clientA = factory.CreateClient();
        var clientB = factory.CreateClient();

        await TestHelpers.Register(clientA, "update-a@example.com", "P@ssw0rd!");
        await TestHelpers.Login(clientA, "update-a@example.com", "P@ssw0rd!");
        var bookA = await TestHelpers.CreateBook(clientA, "A's Book");

        await TestHelpers.Register(clientB, "update-b@example.com", "P@ssw0rd!");
        await TestHelpers.Login(clientB, "update-b@example.com", "P@ssw0rd!");

        var response = await clientB.PutAsJsonAsync($"/api/books/{bookA.Id}", new
        {
            title = "Hijacked",
            author = "Attacker",
            status = "reading",
        });

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Delete_removes_book()
    {
        await using var factory = new ApiFactory();
        var client = factory.CreateClient();
        await TestHelpers.Register(client, "delete@example.com", "P@ssw0rd!");
        await TestHelpers.Login(client, "delete@example.com", "P@ssw0rd!");
        var created = await TestHelpers.CreateBook(client, "To Delete");

        var deleteResponse = await client.DeleteAsync($"/api/books/{created.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await client.GetAsync($"/api/books/{created.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Delete_wrong_user_returns_404()
    {
        await using var factory = new ApiFactory();
        var clientA = factory.CreateClient();
        var clientB = factory.CreateClient();

        await TestHelpers.Register(clientA, "delete-a@example.com", "P@ssw0rd!");
        await TestHelpers.Login(clientA, "delete-a@example.com", "P@ssw0rd!");
        var bookA = await TestHelpers.CreateBook(clientA, "A's Book");

        await TestHelpers.Register(clientB, "delete-b@example.com", "P@ssw0rd!");
        await TestHelpers.Login(clientB, "delete-b@example.com", "P@ssw0rd!");

        var response = await clientB.DeleteAsync($"/api/books/{bookA.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task List_returns_only_own_books()
    {
        await using var factory = new ApiFactory();
        var clientA = factory.CreateClient();
        var clientB = factory.CreateClient();

        await TestHelpers.Register(clientA, "list-own-a@example.com", "P@ssw0rd!");
        await TestHelpers.Login(clientA, "list-own-a@example.com", "P@ssw0rd!");
        await TestHelpers.CreateBook(clientA, "A's Own Book");

        await TestHelpers.Register(clientB, "list-own-b@example.com", "P@ssw0rd!");
        await TestHelpers.Login(clientB, "list-own-b@example.com", "P@ssw0rd!");
        await TestHelpers.CreateBook(clientB, "B's Own Book");

        var listA = await clientA.GetFromJsonAsync<List<BookDto>>("/api/books", ApiJsonOptions);
        var listB = await clientB.GetFromJsonAsync<List<BookDto>>("/api/books", ApiJsonOptions);

        listA.Should().NotBeNull().And.ContainSingle(b => b.Title == "A's Own Book");
        listB.Should().NotBeNull().And.ContainSingle(b => b.Title == "B's Own Book");
        listA.Should().NotContain(b => b.Title == "B's Own Book");
        listB.Should().NotContain(b => b.Title == "A's Own Book");
    }
}
