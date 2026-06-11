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
 * Unmatched results become a runtime error when the chain is evaluated.
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
 * 	.ok([null], (current) => current.data * 2)
 * 	.result()
 * ```
 *
 * @example
 * ```ts
 * const result = FlowMatchStrict(ResultError({ tag: 'Failure', data: 'broken' }))
 * 	.error(['Failure'], (current) => current.data)
 * 	.result()
 * ```
 */
export const FlowMatchStrict: FlowMatchWith<'strict'> = FlowMatchWith('strict')
