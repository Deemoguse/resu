type ExtractTags<S extends string> =
	S extends `${string}{{${infer T}}}${infer R}`
		? T | ExtractTags<R>
		: never

type Tags<S extends string> =
	ExtractTags<S> extends infer T extends string
		? [T] extends [never]
			? null
			: { [K in T]: string }
		: never

export type MessageString<S extends string> =
	S & { InferType: Tags<S> }

export function MessageString<S extends string>(string: S): MessageString<S> {
	return string as MessageString<S>
}
