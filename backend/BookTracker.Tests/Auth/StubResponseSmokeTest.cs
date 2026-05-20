using System.Net;
using System.Net.Http.Json;

using BookTracker.Tests.Fixtures;

using FluentAssertions;

using Xunit;

namespace BookTracker.Tests.Auth;

/// <summary>
/// Phase 1 smoke test: hitting POST /api/auth/register returns a 501 ProblemDetails with errorCode
/// = "NOT_IMPLEMENTED". Proves the request pipeline (CORS, rate limiter, validation, ProblemDetails)
/// is wired even though the handler is a stub. Passes in Phase 1; Phase 2 removes it (the real handler
/// returns 201) and replaces it with the real register/login test suite.
/// </summary>
public class StubResponseSmokeTest : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;
    public StubResponseSmokeTest(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Register_endpoint_returns_501_problemdetails_in_phase_1()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register", new { email = "x@example.com", password = "P@ssw0rd!" });

        response.StatusCode.Should().Be(HttpStatusCode.NotImplemented);
        var problem = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        problem.TryGetProperty("errorCode", out var code).Should().BeTrue();
        code.GetString().Should().Be("NOT_IMPLEMENTED");
    }
}
