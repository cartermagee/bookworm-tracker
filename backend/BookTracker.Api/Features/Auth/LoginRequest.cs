namespace BookTracker.Api.Features.Auth;

/// <summary>Login payload. Validated by <see cref="LoginRequestValidator"/>.</summary>
public sealed record LoginRequest(string Email, string Password);
