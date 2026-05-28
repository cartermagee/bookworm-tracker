using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;

namespace BookTracker.Api.Infrastructure.Exceptions;

/// <summary>
/// Catch-all exception handler. In dev the ex.Message lands in <c>detail</c>;
/// in prod it is suppressed (§2.1, ADR-0010).
/// </summary>
internal sealed class GlobalExceptionHandler(IHostEnvironment env, IProblemDetailsService problems) : IExceptionHandler
{
    private readonly IHostEnvironment _env = env;
    private readonly IProblemDetailsService _problems = problems;

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        var pd = new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Title = "An unexpected error occurred.",
            Status = StatusCodes.Status500InternalServerError,
            Type = "https://datatracker.ietf.org/doc/html/rfc7807",
            Detail = _env.IsDevelopment() ? exception.Message : null,
        };
        pd.Extensions["traceId"] = httpContext.TraceIdentifier;

        return await _problems.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = pd,
            Exception = exception,
        });
    }
}
