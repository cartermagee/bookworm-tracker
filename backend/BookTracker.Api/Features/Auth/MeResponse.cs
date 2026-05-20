namespace BookTracker.Api.Features.Auth;

/// <summary>Response body for GET /api/auth/me.</summary>
public sealed record MeResponse(string Id, string Email);
