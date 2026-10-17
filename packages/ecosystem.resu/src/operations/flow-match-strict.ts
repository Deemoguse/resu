import { FlowMatchWith } from '../factories/flow-match-create-with'
import type { ResultAny } from './result-any'

/**
 * Strict match chain type for result values.
 *
 * @template R
 * Accumulated result type produced by handlers.
 *
 * @template L
 * Input result type that may remain unmatched before evaluation.
 */
export type FlowMatchStrict<
	R extends ResultAny,
	L extends ResultAny,
> =
	[R, L] extends [unknown, unknown]
		? FlowMatchWith.Return<'strict', R, L>
		: never

/**
 * Creates a strict result match chain.
 *
 * Register synchronous handlers with `case()`. TypeScript permits `result()`
 * without arguments only when every input variant is handled. While variants
 * remain, call `result(true)` to preserve unmatched status, tag, and data.
 * At runtime, an unmatched result without the flag becomes `RuntimeError`.
 * Registration errors and handler exceptions become `RuntimeError` in either mode.
 *
 * @param result
 * Result value to match.
 *
 * @returns
 * Strict match chain for the input result.
 *
 * @example
 * ```ts
 * const result = FlowMatchStrict(ResultOk({ data: 2 }))
 * 	.case('ok', null, (current) => current.data * 2)
 * 	.result()
 * ```
 *
 * @example
 * ```ts
 * const result = FlowMatchStrict(ResultError({ tag: 'Failure', data: 'broken' }))
 * 	.case('error', 'Failure', (current) => current.data)
 * 	.result()
 * ```
 *
 * @example
 * ```ts
 * const result = FlowMatchStrict(ResultError({ tag: 'Failure' })).result(true)
 * ```
 */
export const FlowMatchStrict: FlowMatchWith<'strict'> = FlowMatchWith('strict')
