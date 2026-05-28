namespace BookTracker.Core.Entities;

/// <summary>
/// A book in a user's personal library. Multi-tenancy is enforced by <see cref="UserId"/>;
/// every query in the API layer filters by the authenticated user's id.
/// </summary>
public sealed class Book
{
    public Guid Id { get; set; }

    /// <summary>FK to ASP.NET Identity's AspNetUsers.Id (string).</summary>
    public required string UserId { get; set; }

    public required string Title { get; set; }
    public required string Author { get; set; }

    public string? Isbn { get; set; }
    public string? CoverUrl { get; set; }

    /// <summary>Soft reference to Open Library; null for manual entries. See ADR-0005.</summary>
    public string? OpenLibraryWorkId { get; set; }

    public required BookStatus Status { get; set; }

    /// <summary>Optional 1-5 user rating.</summary>
    public int? Rating { get; set; }

    public string? Notes { get; set; }

    /// <summary>UTC. Set by the server on create.</summary>
    public DateTime DateAdded { get; set; }

    /// <summary>UTC. Required iff <see cref="Status"/> is <see cref="BookStatus.Read"/>; null otherwise.</summary>
    public DateTime? DateFinished { get; set; }
}
