using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace BookTracker.Api.Infrastructure.OpenApi;

/// <summary>
/// Adds all non-nullable object properties to the OpenAPI <c>required</c> array.
/// <c>SupportNonNullableReferenceTypes()</c> removes <c>nullable:true</c> but doesn't
/// populate <c>required[]</c> for positional record constructors; this filter bridges
/// that gap so openapi-typescript emits <c>field: T</c> instead of <c>field?: T</c>.
/// </summary>
internal sealed class RequireNonNullablePropertiesSchemaFilter : ISchemaFilter
{
    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
        if (schema.Properties is null || schema.Properties.Count == 0) return;
        foreach (var (name, prop) in schema.Properties)
        {
            if (!prop.Nullable && !schema.Required.Contains(name))
                schema.Required.Add(name);
        }
    }
}
