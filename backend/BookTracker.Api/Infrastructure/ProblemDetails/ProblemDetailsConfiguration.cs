using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;

namespace BookTracker.Api.Infrastructure.ProblemDetails;

/// <summary>Helpers for wiring ProblemDetails consistently across the API — see ADR-0010.</summary>
public static class ProblemDetailsConfiguration
{
    /// <summary>Adds the trace id and (in dev only) the exception message.</summary>
    public static void Customize(Microsoft.AspNetCore.Http.ProblemDetailsContext context)
    {
        var http = context.HttpContext;
        context.ProblemDetails.Instance ??= $"{http.Request.Method} {http.Request.Path}";
        context.ProblemDetails.Extensions["traceId"] = http.TraceIdentifier;

        var env = http.RequestServices.GetService<IHostEnvironment>();
        if (env is null || !env.IsDevelopment())
        {
            // In production never leak ex.Message; the global exception handler scrubs the detail.
            return;
        }

        var feature = http.Features.Get<IExceptionHandlerFeature>();
        if (feature?.Error is { } ex && string.IsNullOrEmpty(context.ProblemDetails.Detail))
        {
            // Dev-only: surface the message so the developer can see what blew up.
            context.ProblemDetails.Detail = ex.Message;
        }
    }
}
