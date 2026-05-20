using BookTracker.Core.Entities;

using FluentValidation;

namespace BookTracker.Api.Features.Books;

public sealed class CreateBookRequestValidator : AbstractValidator<CreateBookRequest>
{
    public CreateBookRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Author).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Isbn).MaximumLength(20).When(x => !string.IsNullOrEmpty(x.Isbn));
        RuleFor(x => x.CoverUrl)
            .MaximumLength(500)
            .Must(url => string.IsNullOrEmpty(url) || Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("CoverUrl must be a valid absolute URL.");
        RuleFor(x => x.OpenLibraryWorkId).MaximumLength(50);
        RuleFor(x => x.Notes).MaximumLength(5000);
        RuleFor(x => x.Rating).InclusiveBetween(1, 5).When(x => x.Rating.HasValue);

        // DateFinished required iff Status == Read. See §4 cross-cutting rule.
        RuleFor(x => x.DateFinished)
            .NotNull().When(x => x.Status == BookStatus.Read)
            .WithMessage("DateFinished is required when Status is 'Read'.");
        RuleFor(x => x.DateFinished)
            .Null().When(x => x.Status != BookStatus.Read)
            .WithMessage("DateFinished must be null unless Status is 'Read'.");
    }
}
