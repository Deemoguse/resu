import { FlowMatchWith } from '../factories/flow-match-create-with'
import type { ResultAny } from './result-any'

/**
 * Loose match chain type for result values.
 *
 * @template R
 * Accumulated result type produced by handlers.
 *
 * @template L
 * Input result type that may remain unmatched.
 */
export type FlowMatchLoose<
	R extends ResultAny,
	L extends ResultAny,
> =
	[R, L] extends [unknown, unknown]
		? FlowMatchWith.Return<'loose', R, L>
		: never

/**
 * Creates a loose result match chain.
 *
 * An unmatched result is normalized into a new result with the same status,
 * tag, and data when the chain is evaluated.
 *
 * @param result
 * Result value to match.
 *
 * @returns
 * Loose match chain for the input result.
 *
 * @example
 * ```ts
 * const result = FlowMatchLoose(ResultOk({ data: 2 }))
 * 	.ok([null], (current) => current.data * 2)
 * 	.result()
 * ```
 *
 * @example
 * ```ts
 * const result = FlowMatchLoose(ResultError({ tag: 'Failure', data: 'broken' }))
 * 	.error(['Failure'], (current) => current.data)
 * 	.result()
 * ```
 */
export const FlowMatchLoose: FlowMatchWith<'loose'> = FlowMatchWith('loose')
