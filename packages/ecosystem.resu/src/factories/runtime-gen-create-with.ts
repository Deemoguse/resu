import { ResultOk } from '../operations/result-ok'
import { ResultIsError } from '../operations/result-is-error'
import { ResultOkFromUnlessError } from '../operations/result-ok-from-unless-error'
import { FlowTrySync } from '../operations/flow-try-sync'
import { FlowTryAsync } from '../operations/flow-try-async'
import type { ResultAny } from '../operations/result-any'
import type { ResultExtractError } from '../operations/result-extract-error'

/**
 * Types for running generator-based result flows.
 */
export namespace RuntimeGenCreateWith {
	/**
	 * Flow result returned after a generator runtime completes.
	 *
	 * @template T
	 * Runtime execution mode.
	 *
	 * @template Y
	 * Result type yielded by the generator.
	 *
	 * @template R
	 * Final value returned by the generator.
	 */
	export type Return<
		T extends 'sync' | 'async',
		Y,
		R,
	> =
		[T, Y, R] extends [unknown, unknown, unknown]
			? T extends 'sync'
				// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
				? FlowTrySync<ResultExtractError<Y> | ([R] extends [void] ? ResultOk<null, null> : ResultOkFromUnlessError<R>)>
				// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
				: FlowTryAsync<ResultExtractError<Y> | ([R] extends [void] ? ResultOk<null, null> : ResultOkFromUnlessError<R>)>
			: never
}

/**
 * Function type for sync or async generator runtimes.
 *
 * @template T
 * Runtime execution mode.
 */
export type RuntimeGenCreateWith<T extends 'sync' | 'async'> =
	[T] extends [unknown]
		? <Y, R> (
			gen: () => T extends 'async'
				? AsyncGenerator<Y, R>
				: Generator<Y, R>,
		) => (
			RuntimeGenCreateWith.Return<T, Y, R>
		)
		: never

/**
 * Creates a generator runtime runner for the selected execution mode.
 *
 * @template T
 * Runtime execution mode.
 *
 * @param type
 * Sync or async runtime mode.
 *
 * @returns
 * Function that executes compatible generators and returns a flow result.
 *
 * @example
 * ```ts
 * const run = RuntimeGenCreateWith('sync')
 * const result = run(function* () {
 * 	return 1
 * })
 * ```
 *
 * @example
 * ```ts
 * const run = RuntimeGenCreateWith('async')
 * const result = await run(async function* () {
 * 	return 1
 * })
 * ```
 */
export function RuntimeGenCreateWith<T extends 'sync' | 'async'>(type: T): RuntimeGenCreateWith<T> {
	return function (gen) {
		const runtime = gen()
		return type === 'sync'
			? FlowTrySync(() => {
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				while (true) {
					const result = processIter(runtime.next() as IteratorResult<ResultAny, unknown>)
					if (result) return result
				}
			})
			: FlowTryAsync(async () => {
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				while (true) {
					const result = processIter(await runtime.next() as IteratorResult<ResultAny, unknown>)
					if (result) return result
				}
			})
	} as RuntimeGenCreateWith<T>
}

/**
 * Resolves one generator iteration into a terminal result when needed.
 *
 * @param iter
 * Iterator result to inspect.
 *
 * @returns
 * Terminal result or `undefined` when iteration should continue.
 */
function processIter(iter: IteratorResult<ResultAny, unknown>): undefined | ResultAny {
	if (iter.done) return ResultOkFromUnlessError(iter.value)
	if (ResultIsError(iter.value)) return iter.value
}
