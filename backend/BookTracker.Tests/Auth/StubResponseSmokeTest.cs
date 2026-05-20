using System.Net;
using System.Net.Http.Json;

using BookTracker.Tests.Fixtures;

using FluentAssertions;

using Xunit;

namespace BookTracker.Tests.Auth;

/// <summary>
/// Each test gets its own ApiFactory so the in-process rate-limiter bucket resets
/// between tests (the limiter keys on RemoteIpAddress, which is always 127.0.0.1
/// for WebApplicationFactory clients — a shared factory would exhaust the 5/min cap).
/// </summary>
public class AuthEndpointTests
{
    [Fact]
    public async Task Register_with_valid_credentials_returns_201()
    {
        await using var factory = new ApiFactory();
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register",
            new { email = "test@example.com", password = "ValidPassword1!" });
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Register_duplicate_email_returns_409()
    {
        await using var factory = new ApiFactory();
        var client = factory.CreateClient();
        var payload = new { email = "dup@example.com", password = "ValidPassword1!" };
        await client.PostAsJsonAsync("/api/auth/register", payload);
        var second = await client.PostAsJsonAsync("/api/auth/register", payload);
        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Register_invalid_email_returns_400()
    {
        await using var factory = new ApiFactory();
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register",
            new { email = "not-an-email", password = "ValidPassword1!" });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_valid_credentials_returns_204_with_cookie()
    {
        await using var factory = new ApiFactory();
        var client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
        await client.PostAsJsonAsync("/api/auth/register",
            new { email = "login@example.com", password = "ValidPassword1!" });
        var response = await client.PostAsJsonAsync("/api/auth/login",
            new { email = "login@example.com", password = "ValidPassword1!" });
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        response.Headers.Should().ContainKey("Set-Cookie");
    }

    [Fact]
    public async Task Login_wrong_password_returns_401()
    {
        await using var factory = new ApiFactory();
        var client = factory.CreateClient();
        await client.PostAsJsonAsync("/api/auth/register",
            new { email = "badpw@example.com", password = "ValidPassword1!" });
        var response = await client.PostAsJsonAsync("/api/auth/login",
            new { email = "badpw@example.com", password = "WrongPassword9!" });
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_when_authenticated_returns_200_with_id_and_email()
    {
        await using var factory = new ApiFactory();
        var client = factory.CreateClient();
        await TestHelpers.Register(client, "me@example.com", "ValidPassword1!");
        await TestHelpers.Login(client, "me@example.com", "ValidPassword1!");
        var response = await client.GetAsync("/api/auth/me");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        body.TryGetProperty("id", out _).Should().BeTrue();
        body.TryGetProperty("email", out var emailProp).Should().BeTrue();
        emailProp.GetString().Should().Be("me@example.com");
    }

    [Fact]
    public async Task Me_when_not_authenticated_returns_401()
    {
        await using var factory = new ApiFactory();
        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/auth/me");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Logout_returns_204()
    {
        await using var factory = new ApiFactory();
        var client = factory.CreateClient();
        await TestHelpers.Register(client, "logout@example.com", "ValidPassword1!");
        await TestHelpers.Login(client, "logout@example.com", "ValidPassword1!");
        var response = await client.PostAsync("/api/auth/logout", null);
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
