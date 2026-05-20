namespace BookTracker.Api.Features.Auth;

/// <summary>Registration payload. Validated by <see cref="RegisterRequestValidator"/>.</summary>
public sealed record RegisterRequest(string Email, string Password);
