import { FlowFunctionWith } from '../factories/flow-function-create-with'

/**
 * Async function wrapped to return a promised flow result.
 *
 * @template A
 * Arguments accepted by the wrapped function.
 *
 * @template R
 * Value returned by the wrapped function before result wrapping.
 */
export type FlowFunctionAsync<
	A extends unknown[],
	R,
> =
	[A, R] extends [unknown, unknown]
		? FlowFunctionWith.Return<'async', A, R>
		: never

/**
 * Wraps an async-capable callback so every call resolves to a result.
 *
 * @param func
 * Callback to execute through async flow try.
 *
 * @returns
 * Function with the same arguments that returns an async flow result.
 *
 * @example
 * ```ts
 * const loadLength = FlowFunctionAsync(async (value: string) => value.length)
 * const result = await loadLength('ready')
 * ```
 *
 * @example
 * ```ts
 * const fromSync = FlowFunctionAsync((value: string) => value.length)
 * const result = await fromSync('ready')
 * ```
 */
export const FlowFunctionAsync: FlowFunctionWith<'async'> = FlowFunctionWith('async')
