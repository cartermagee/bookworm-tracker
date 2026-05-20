using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace BookTracker.Api.Infrastructure.Auth;

/// <summary>
/// Mints short-lived JWTs for authenticated users. Phase 1 stub; Phase 2 wires it through the
/// login endpoint. The token is set as an httpOnly cookie by the auth endpoint — see ADR-0006.
/// </summary>
public sealed class JwtTokenService(IConfiguration configuration)
{
    private readonly IConfiguration _configuration = configuration;

    public string Create(IdentityUser user)
    {
        var secret = _configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret missing — set via `dotnet user-secrets` in dev or Jwt__Secret env var in prod. See README.");
        var issuer = _configuration["Jwt:Issuer"] ?? "BookTracker";
        var audience = _configuration["Jwt:Audience"] ?? "BookTracker";
        var expiryMinutes = int.Parse(_configuration["Jwt:ExpiryMinutes"] ?? "60", System.Globalization.CultureInfo.InvariantCulture);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
