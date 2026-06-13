import type { Result } from '../classes/result'
import type { ResultAny } from '../operations/result-any'
import type { ResultAnyError } from '../operations/result-any-error'
import type { ResultOkFromUnlessError } from '../operations/result-ok-from-unless-error'

/**
 * Value shape accepted from flow callbacks before result normalization.
 *
 * Plain values may be returned directly, existing error results stay on the
 * error branch, and untagged ok results may be supplied as either the result
 * itself or its raw data.
 *
 * @template V
 * Declared value or result type produced by the callback.
 */
export type UtilsResultSource<V> = [V] extends [unknown]
	? V extends ResultAny
		? V extends ResultAnyError
			? V
			: V extends Result<{
				status: Result.Status
				tag: infer T extends Result.Tag
				data: infer D extends Result.Data
			}>
				? T extends null
					? D | V
					: V
				: V
		: V | ResultOkFromUnlessError<V>
	: never
