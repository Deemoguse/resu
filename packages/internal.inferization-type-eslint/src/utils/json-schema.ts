import type { FromSchema, JSONSchema } from 'json-schema-to-ts'

export type JsonSchema<S extends JSONSchema> =
	S & { InferType: FromSchema<S> }

export function JsonSchema<const S extends JSONSchema>(schema: S): JsonSchema<S> {
	return schema as JsonSchema<S>
}
