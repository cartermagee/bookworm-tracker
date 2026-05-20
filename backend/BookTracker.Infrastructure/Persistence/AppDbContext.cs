using BookTracker.Core.Entities;
using BookTracker.Infrastructure.Persistence.Configurations;

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BookTracker.Infrastructure.Persistence;

/// <summary>
/// Single application DbContext — owns both ASP.NET Identity tables and the <see cref="Book"/> table.
/// Inherits <see cref="IdentityDbContext{TUser}"/> with default string keys so that <see cref="Book.UserId"/>
/// (a string) matches AspNetUsers.Id. See ADR-0002 and the locked-decision memo on Identity DbContext.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<IdentityUser>(options)
{
    public DbSet<Book> Books => Set<Book>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfiguration(new BookConfiguration());
    }
}
