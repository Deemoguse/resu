import type { Result } from '../classes/result'
import type { ResultAny } from '../operations/result-any'
import type { ResultAnyError } from '../operations/result-any-error'
import type { ResultOkFrom } from '../operations/result-ok-from'

/**
 * Flow callback source type accepted before result normalization.
 *
 * Plain values may be returned directly or as ok results, existing error
 * results stay on the error branch, and untagged ok results may be supplied as
 * either the result itself or its raw data.
 *
 * @template V
 * Declared value or result type produced by the callback.
 */
export type UtilsSource<V> = [V] extends [unknown]
	? V extends ResultAny
		? V extends ResultAnyError
			? V
			: V extends {
				status: 'ok'
				tag: infer T extends Result.Tag
				data: infer D extends Result.Data
			}
				? T extends null
<<<<<<< Updated upstream
					? D | ResultOkFrom<D>
					: V
				: V
		: V | ResultOkFrom<V>
=======
					? D | ResultOkFrom<NoInfer<D>>
					: V
				: V
		: V | ResultOkFrom<NoInfer<V>>
>>>>>>> Stashed changes
	: never
