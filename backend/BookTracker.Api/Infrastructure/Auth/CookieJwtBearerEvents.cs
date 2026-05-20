using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace BookTracker.Api.Infrastructure.Auth;

/// <summary>
/// JwtBearer events that pull the JWT out of the httpOnly cookie instead of the Authorization header.
/// See ADR-0006. The cookie name is the const below; the auth endpoint sets it on login.
/// </summary>
public sealed class CookieJwtBearerEvents : JwtBearerEvents
{
    public const string CookieName = "auth";

    public override Task MessageReceived(MessageReceivedContext context)
    {
        if (context.Request.Cookies.TryGetValue(CookieName, out var token) && !string.IsNullOrEmpty(token))
        {
            context.Token = token;
        }
        return Task.CompletedTask;
    }
}
