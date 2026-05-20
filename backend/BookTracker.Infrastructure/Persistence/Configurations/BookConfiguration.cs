using BookTracker.Core.Entities;

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BookTracker.Infrastructure.Persistence.Configurations;

/// <summary>EF Core configuration for <see cref="Book"/> — column constraints, indexes, and the user FK.</summary>
public sealed class BookConfiguration : IEntityTypeConfiguration<Book>
{
    public void Configure(EntityTypeBuilder<Book> builder)
    {
        builder.ToTable("Books");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.UserId).IsRequired();
        builder.Property(b => b.Title).IsRequired().HasMaxLength(300);
        builder.Property(b => b.Author).IsRequired().HasMaxLength(200);
        builder.Property(b => b.Isbn).HasMaxLength(20);
        builder.Property(b => b.CoverUrl).HasMaxLength(500);
        builder.Property(b => b.OpenLibraryWorkId).HasMaxLength(50);
        builder.Property(b => b.Notes).HasMaxLength(5000);

        // Status persisted as string so the SQLite column is human-readable and matches the wire format.
        // See ADR for the "string enums on the wire" rule.
        builder.Property(b => b.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // Critical index for tenancy queries: every books query filters by UserId.
        builder.HasIndex(b => b.UserId);

        // Composite index supporting "list current user's books ordered by DateAdded desc".
        builder.HasIndex(b => new { b.UserId, b.DateAdded })
            .HasDatabaseName("IX_Books_UserId_DateAdded")
            .IsDescending(false, true);

        // FK to Identity's AspNetUsers; cascade so deleting a user removes their books.
        builder.HasOne<IdentityUser>()
            .WithMany()
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
