import { FlowFunctionWith } from '../factories/flow-function-create-with'

/**
 * Synchronous function wrapped to return a flow result.
 *
 * @template A
 * Arguments accepted by the wrapped function.
 *
 * @template R
 * Value returned by the wrapped function before result wrapping.
 */
export type FlowFunctionSync<
	A extends unknown[],
	R,
> =
	[A, R] extends [unknown, unknown]
		? FlowFunctionWith.Return<'sync', A, R>
		: never

/**
 * Wraps a synchronous callback so every call returns a result.
 *
 * @param func
 * Synchronous callback to execute through flow try.
 *
 * @returns
 * Function with the same arguments that returns a sync flow result.
 *
 * @example
 * ```ts
 * const parseLength = FlowFunctionSync((value: string) => value.length)
 * const result = parseLength('ready')
 * ```
 *
 * @example
 * ```ts
 * const divide = FlowFunctionSync((left: number, right: number) => left / right)
 * const result = divide(10, 2)
 * ```
 */
export const FlowFunctionSync: FlowFunctionWith<'sync'> = FlowFunctionWith('sync')
