using BookTracker.Api.Features.Books;
using BookTracker.Core.Entities;

using FluentAssertions;
using FluentValidation;

using Xunit;

namespace BookTracker.Tests.Validators;

/// <summary>
/// Pure unit tests for <see cref="CreateBookRequestValidator"/>.
/// No HTTP stack needed — instantiate the validator directly.
/// The global PropertyNameResolver is set to camelCase here to match the production
/// setting in Program.cs; without this the resolver may default to PascalCase when
/// the ApiFactory-based tests haven't run first in the same process.
/// </summary>
public class CreateBookRequestValidatorTests
{
    private readonly CreateBookRequestValidator _validator;

    public CreateBookRequestValidatorTests()
    {
        // Mirror the resolver from Program.cs so PropertyName values are camelCase.
        ValidatorOptions.Global.PropertyNameResolver = (_, member, _) =>
        {
            if (member is null) return null;
            var name = member.Name;
            return string.IsNullOrEmpty(name) ? name : char.ToLowerInvariant(name[0]) + name[1..];
        };
        _validator = new CreateBookRequestValidator();
    }

    /// <summary>Returns a fully valid request; individual tests mutate via <c>with</c>.</summary>
    private static CreateBookRequest ValidRequest() => new(
        Title: "Dune",
        Author: "Frank Herbert",
        Isbn: null,
        CoverUrl: null,
        OpenLibraryWorkId: null,
        Status: BookStatus.WantToRead,
        Rating: null,
        Notes: null,
        DateFinished: null);

    [Fact]
    public void Valid_request_passes_validation()
    {
        var result = _validator.Validate(ValidRequest());

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Missing_title_fails_validation()
    {
        var result = _validator.Validate(ValidRequest() with { Title = "" });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "title");
    }

    [Fact]
    public void Missing_author_fails_validation()
    {
        var result = _validator.Validate(ValidRequest() with { Author = "" });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "author");
    }

    [Fact]
    public void Status_out_of_range_fails_validation()
    {
        // BookStatus values are 0, 1, 2. Casting 99 produces an undefined enum value.
        var result = _validator.Validate(ValidRequest() with { Status = (BookStatus)99 });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "status");
    }

    [Fact]
    public void Rating_below_1_fails_validation()
    {
        var result = _validator.Validate(ValidRequest() with { Rating = 0 });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "rating");
    }

    [Fact]
    public void Rating_above_5_fails_validation()
    {
        var result = _validator.Validate(ValidRequest() with { Rating = 6 });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "rating");
    }

    [Fact]
    public void Read_status_without_dateFinished_fails_validation()
    {
        var result = _validator.Validate(ValidRequest() with
        {
            Status = BookStatus.Read,
            DateFinished = null,
        });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "dateFinished");
    }

    [Fact]
    public void Read_status_with_dateFinished_passes_validation()
    {
        var result = _validator.Validate(ValidRequest() with
        {
            Status = BookStatus.Read,
            DateFinished = DateTime.UtcNow,
        });

        result.IsValid.Should().BeTrue();
    }
}
