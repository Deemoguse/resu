import { ResultErrorFrom } from '../operations/result-error-from'
import type { Result } from '../classes/result'
import type { NonUndefinedSync } from '../types/non-undefined-sync'

export namespace InternalErrorWith {
	export type Return<
		T extends Result.Tag,
		D = Result.AnyData,
	> =
		[T, D] extends [unknown, unknown]
			? ResultErrorFrom<D, T>
			: never
}

export type InternalErrorWith<T extends Result.Tag> = [T] extends [unknown]
	? {
		<E extends Error>(error: E): InternalErrorWith.Return<T, E>
		(message: string): InternalErrorWith.Return<T, Error>
		<D = null>(data: NonUndefinedSync<D>): InternalErrorWith.Return<T, D>
		(): InternalErrorWith.Return<T, null>
	}
	: never

export function InternalErrorWith<T extends Result.Tag>(tag: T): InternalErrorWith<T> {
	return function (data: unknown) {
		const resolvedData = data instanceof Error
			? data
			: typeof data === 'string'
				? new Error(data)
				: data

		return ResultErrorFrom(resolvedData, tag)
	} as InternalErrorWith<T>
}
