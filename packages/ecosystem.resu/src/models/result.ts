import type { NonUndefined } from '../types/non-undefined'

export namespace Result {
	export type Status = 'ok' | 'error'
	export type Tag = null | string
	export type Data = unknown

	export type AnyTag = NonUndefined<Tag>
	export type AnyData = NonUndefined<null | {}> // eslint-disable-line @typescript-eslint/no-empty-object-type

	export type Params<
		S extends Result.Status,
		T extends Result.Tag,
		D,
	> = {
		status: S
		tag?: NonUndefined<T>
		data?: NonUndefined<D>
	}
}

export class Result<
	S extends Result.Status = Result.Status,
	T extends Result.Tag = null,
	D = null,
> {
	public readonly status: S
	public readonly tag: NonUndefined<T>
	public readonly data: NonUndefined<D>

	constructor(params: Result.Params<S, T, D>) {
		this.status = params.status
		this.tag = (params.tag ?? null) as NonUndefined<T>
		this.data = (params.data ?? null) as NonUndefined<D>

		return Object.freeze(this) as unknown as Result<S, T, D>
	}
}
