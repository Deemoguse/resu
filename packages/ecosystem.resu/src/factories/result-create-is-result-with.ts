import { Result } from '../models/result'
import type { ResultAny } from '../operations/result-any'
import type { ResultAnyOk } from '../operations/result-any-ok'
import type { ResultAnyError } from '../operations/result-any-error'

export declare namespace IsResultWith {
	export type Return<
		S extends 'any' | Result.Status,
		V,
	> =
		[S, V] extends [unknown, unknown]
			? S extends 'any'
				? V extends ResultAny ? true : false
				: S extends 'ok'
					? V extends ResultAnyOk ? true : false
					: V extends ResultAnyError ? true : false
			: never
}

export type IsResultWith<
	S extends 'any' | Result.Status,
> =
	[S] extends [unknown]
		? (value: unknown) => value is S extends 'ok' ? ResultAnyOk : ResultAnyError
		: never

export function IsResultWith<S extends 'any' | Result.Status>(status: S): IsResultWith<S> {
	return (value): value is S extends 'ok' ? ResultAnyOk : ResultAnyError => {
		const isResultInstance = value instanceof Result
		if (!isResultInstance) return false

		return status === 'any'
			? value.status === 'ok' || value.status === 'error'
			: value.status === status
	}
}
