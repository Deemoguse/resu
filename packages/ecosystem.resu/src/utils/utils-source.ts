import type { Result } from '../classes/result'
import type { ResultAny } from '../operations/result-any'
import type { ResultAnyError } from '../operations/result-any-error'
import type { ResultOkFrom } from '../operations/result-ok-from'

/**
 * Flow callback source type accepted before result normalization.
 *
 * Plain values may be supplied directly or wrapped in an `ok` result.
 * Existing `error` results and tagged `ok` results are preserved, while an
 * untagged `ok` result is represented through the accepted forms of its data.
 *
 * @template V
 * Declared source type produced by the callback.
 */
export type UtilsSource<V> = [V] extends [unknown]
	? V extends ResultAny
		? V extends ResultAnyError
			? V
			: V extends Result<{
				status: 'ok'
				tag: infer T extends Result.Tag
				data: infer D extends Result.Data
			}>
				? T extends null
					? D | ResultOkFrom<NoInfer<D>>
					: V
				: V
		: V | ResultOkFrom<NoInfer<V>>
	: never
