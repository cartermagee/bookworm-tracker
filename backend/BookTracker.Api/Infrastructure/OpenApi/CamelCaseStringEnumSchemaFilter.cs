using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace BookTracker.Api.Infrastructure.OpenApi;

/// <summary>
/// Emits enum schemas as camelCase strings in the OpenAPI spec to match the
/// JsonStringEnumConverter(JsonNamingPolicy.CamelCase) configured in JSON options.
/// Without this Swashbuckle 7.x emits integer schemas for enums.
/// </summary>
internal sealed class CamelCaseStringEnumSchemaFilter : ISchemaFilter
{
    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
        if (!context.Type.IsEnum) return;
        schema.Type = "string";
        schema.Format = null;
        schema.Enum.Clear();
        foreach (var name in Enum.GetNames(context.Type))
        {
            var camelName = char.ToLowerInvariant(name[0]) + name[1..];
            schema.Enum.Add(new OpenApiString(camelName));
        }
    }
}
