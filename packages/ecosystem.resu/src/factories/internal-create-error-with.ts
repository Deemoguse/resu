import { ResultErrorFrom } from '../operations/result-error-from'
import type { Result } from '../models/result'
import type { NonUndefined } from '../types/non-undefined'

export namespace InternalCreateErrorWith {
	export type Return<
		T extends Result.Tag,
		D,
	> =
		[T, D] extends [unknown, unknown]
			? ResultErrorFrom<D, T>
			: never
}

export type InternalCreateErrorWith<T extends Result.Tag> = [T] extends [unknown]
	? {
		<E extends Error>(error: E): InternalCreateErrorWith.Return<T, E>
		<M extends string>(message: M): InternalCreateErrorWith.Return<T, M>
		<D = null>(data: NonUndefined<D>): InternalCreateErrorWith.Return<T, D>
		(): InternalCreateErrorWith.Return<T, null>
	}
	: never

export function InternalCreateErrorWith<T extends Result.Tag>(tag: T): InternalCreateErrorWith<T> {
	return function (data: unknown) {
		return ResultErrorFrom(data, tag)
	} as InternalCreateErrorWith<T>
}
