using System.Net;
using System.Net.Http.Json;

using BookTracker.Api.Features.Books;
using BookTracker.Tests.Fixtures;

using FluentAssertions;

using Xunit;

namespace BookTracker.Tests.Books;

/// <summary>
/// Phase 1 writes this test verbatim per master prompt §8. The Skip attribute is removed in Phase 2,
/// at which point the Books endpoint handlers actually filter by UserId and the test passes.
/// This is the single most important test in the repo — it is the gate between Phase 2's start
/// and Phase 2's completion.
/// </summary>
public class MultiTenancyTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public MultiTenancyTests(ApiFactory factory) => _factory = factory;

    [Fact(Skip = "Phase 2 implements this — remove Skip when ready")]
    public async Task User_cannot_read_another_users_book()
    {
        // Arrange: two registered users, each with one book.
        var clientA = _factory.CreateClient();
        var clientB = _factory.CreateClient();

        await TestHelpers.Register(clientA, "alice@example.com", "P@ssw0rd!");
        await TestHelpers.Login(clientA, "alice@example.com", "P@ssw0rd!");
        var aliceBook = await TestHelpers.CreateBook(clientA, title: "Alice's Book");

        await TestHelpers.Register(clientB, "bob@example.com", "P@ssw0rd!");
        await TestHelpers.Login(clientB, "bob@example.com", "P@ssw0rd!");

        // Act: Bob attempts to read Alice's book by GUID.
        var response = await clientB.GetAsync($"/api/books/{aliceBook.Id}");

        // Assert: Bob gets 404 (NOT 403 — we do not leak existence).
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        // Act: Bob attempts to list books; should see only his own (zero).
        var listResponse = await clientB.GetAsync("/api/books");
        var books = await listResponse.Content.ReadFromJsonAsync<List<BookDto>>();
        books.Should().NotBeNull().And.BeEmpty();
    }
}
