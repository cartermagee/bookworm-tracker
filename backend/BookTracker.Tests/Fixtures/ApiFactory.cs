using BookTracker.Infrastructure.Persistence;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BookTracker.Tests.Fixtures;

/// <summary>
/// Boots <c>Program</c> for integration tests. Replaces the SQLite file connection with an
/// in-memory SQLite (per-fixture) so tests are isolated and fast. Also sets a Jwt:Secret so
/// the fail-fast guard in Program.cs is satisfied during the test boot.
/// Schema is created by Program.cs's startup Migrate() — we just provide the connection.
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    private SqliteConnection? _connection;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        Environment.SetEnvironmentVariable("Jwt__Secret", "test-secret-this-is-at-least-thirty-two-bytes-long-and-then-some");

        builder.ConfigureServices(services =>
        {
            // Remove every service the AddDbContext call registered (DbContextOptions,
            // DbContextOptions<TContext>, AppDbContext, IDbContextFactory<TContext>, etc).
            var toRemove = services
                .Where(d => d.ServiceType.FullName?.Contains(nameof(AppDbContext), StringComparison.Ordinal) == true)
                .ToList();
            foreach (var d in toRemove)
            {
                services.Remove(d);
            }

            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();
            services.AddDbContext<AppDbContext>(opts => opts.UseSqlite(_connection));
        });
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _connection?.Dispose();
        }
        base.Dispose(disposing);
    }
}
