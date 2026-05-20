namespace BookTracker.Infrastructure.OpenLibrary;

/// <summary>Bound from configuration section "OpenLibrary".</summary>
public sealed class OpenLibraryOptions
{
    public const string SectionName = "OpenLibrary";

    /// <summary>Base URL for the Open Library API. Defaults to the public endpoint.</summary>
    public string BaseUrl { get; set; } = "https://openlibrary.org";

    /// <summary>Per-request timeout in seconds.</summary>
    public int TimeoutSeconds { get; set; } = 10;
}
