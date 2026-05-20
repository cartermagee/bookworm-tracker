namespace BookTracker.Core.Entities;

/// <summary>
/// Reading status of a book in a user's library.
/// Serialized on the wire as a string ("WantToRead" | "Reading" | "Read"); see <see cref="Book"/> and the EF Core configuration.
/// </summary>
public enum BookStatus
{
    WantToRead,
    Reading,
    Read,
}
