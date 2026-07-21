import { Match } from '../classes/match'
import { UtilsErrorRuntime } from '../utils/utils-error-runtime'
import type { FlowTrySync } from '../operations/flow-try-sync'
import type { ResultAny } from '../operations/result-any'

/**
 * Types for constructing loose and strict flow match chains.
 */
export namespace FlowMatchWith {
	/**
	 * Match kind that returns loose flow match chains.
	 */
	export interface LooseKind extends Match.Kind {
		/**
		 * Concrete loose match chain type.
		 */
		type: FlowMatchLoose<
			this['R'] extends ResultAny ? this['R'] : never,
			this['L'] extends ResultAny ? this['L'] : never
		>
	}

	/**
	 * Match kind that returns strict flow match chains.
	 */
	export interface StrictKind extends Match.Kind {
		/**
		 * Concrete strict match chain type.
		 */
		type: FlowMatchStrict<
			this['R'] extends ResultAny ? this['R'] : never,
			this['L'] extends ResultAny ? this['L'] : never
		>
	}

	/**
	 * Match chain type returned for a selected mode.
	 *
	 * @template M
	 * Match mode.
	 *
	 * @template R
	 * Accumulated handled result type.
	 *
	 * @template L
	 * Remaining input result type.
	 */
	export type Return<
		M extends 'loose' | 'strict',
		R extends ResultAny,
		L extends ResultAny,
	> =
		[M, R, L] extends [unknown, unknown, unknown]
			? M extends 'loose'
				? FlowMatchLoose<R, L>
				: FlowMatchStrict<R, L>
			: never
}

/**
 * Factory type for creating loose or strict match chains.
 *
 * @template M
 * Match mode.
 */
export type FlowMatchWith<
	M extends 'loose' | 'strict',
> =
	[M] extends [unknown]
		? <
			R extends ResultAny = never,
			L extends ResultAny = never,
		>(
			result: L,
		) => (
			FlowMatchWith.Return<M, R, L>
		)
		: never

/**
 * Creates a match-chain factory for a selected mode.
 *
 * @template M
 * Match mode to bind.
 *
 * @param mode
 * Match mode used by produced chains.
 *
 * @returns
 * Factory that creates match chains over result values.
 *
 * @example
 * ```ts
 * const Loose = FlowMatchWith('loose')
 * const chain = Loose(ResultOk({ data: 1 }))
 * ```
 *
 * @example
 * ```ts
 * const Strict = FlowMatchWith('strict')
 * const chain = Strict(ResultError({ tag: 'Failure' }))
 * ```
 */
export function FlowMatchWith<
	M extends 'loose' | 'strict',
>(
	mode: M,
): (
	FlowMatchWith<M>
) {
	return function (result: ResultAny) {
		return mode === 'loose'
			? new FlowMatchLoose(result)
			: new FlowMatchStrict(result)
	} as FlowMatchWith<M>
}

/**
 * Loose match chain that retains the fields of unmatched results.
 *
 * @template R
 * Accumulated result type produced by handlers.
 *
 * @template L
 * Input result type that may remain unmatched.
 *
 * @example
 * ```ts
 * const result = new FlowMatchLoose(ResultOk({ data: 2 }))
 * 	.ok([null], (current) => current.data * 2)
 * 	.result()
 * ```
 *
 * @example
 * ```ts
 * const result = new FlowMatchLoose(ResultError({ tag: 'Failure', data: 'broken' }))
 * 	.error(['Failure'], (current) => current.data)
 * 	.result()
 * ```
 */
export class FlowMatchLoose<
	R extends ResultAny = never,
	L extends ResultAny = never,
>
	extends Match<R, L, FlowMatchWith.LooseKind>
{
	/**
	 * Creates a loose match chain.
	 *
	 * @param result
	 * Result value to match.
	 *
	 * @param store
	 * Optional handler store for chained instances.
	 *
	 * @example
	 * ```ts
	 * const chain = new FlowMatchLoose(ResultOk({ data: 1 }))
	 * ```
	 *
	 * @example
	 * ```ts
	 * const chain = new FlowMatchLoose(ResultError({ tag: 'Failure' }))
	 * ```
	 */
	constructor(result: L, store?: Match.Store) {
		super(new.target as Match.KindTarget<FlowMatchWith.LooseKind>, result, store)
	}

	/**
	 * Evaluates a loose match chain.
	 *
	 * @returns
	 * Handler result when matched, otherwise a normalized result with the input
	 * status, tag, and data.
	 *
	 * @example
	 * ```ts
	 * const result = FlowMatchLoose(ResultOk({ data: 1 })).result()
	 * ```
	 *
	 * @example
	 * ```ts
	 * const result = FlowMatchLoose(ResultError({ tag: 'Failure' }))
	 * 	.any((current) => current.tag)
	 * 	.result()
	 * ```
	 */
	public result(): FlowTrySync<R | L> {
		const result = this.resolveResult((_, result) => result)
		return result as FlowTrySync<R | L>
	}
}

/**
 * Strict match chain that reports a runtime error when no handler matches.
 *
 * @template R
 * Accumulated result type produced by handlers.
 *
 * @template L
 * Input result type that may remain unmatched before evaluation.
 *
 * @example
 * ```ts
 * const result = new FlowMatchStrict(ResultOk({ data: 2 }))
 * 	.ok([null], (current) => current.data * 2)
 * 	.result()
 * ```
 *
 * @example
 * ```ts
 * const result = new FlowMatchStrict(ResultError({ tag: 'Failure', data: 'broken' }))
 * 	.error(['Failure'], (current) => current.data)
 * 	.result()
 * ```
 */
export class FlowMatchStrict<
	R extends ResultAny = never,
	L extends ResultAny = never,
>
	extends Match<R, L, FlowMatchWith.StrictKind>
{
	/**
	 * Creates a strict match chain.
	 *
	 * @param result
	 * Result value to match.
	 *
	 * @param store
	 * Optional handler store for chained instances.
	 *
	 * @example
	 * ```ts
	 * const chain = new FlowMatchStrict(ResultOk({ data: 1 }))
	 * ```
	 *
	 * @example
	 * ```ts
	 * const chain = new FlowMatchStrict(ResultError({ tag: 'Failure' }))
	 * ```
	 */
	constructor(result: L, store?: Match.Store) {
		super(new.target as Match.KindTarget<FlowMatchWith.StrictKind>, result, store)
	}

	/**
	 * Evaluates a strict match chain.
	 *
	 * @returns
	 * Handler result when matched, otherwise a runtime error result.
	 *
	 * @example
	 * ```ts
	 * const result = FlowMatchStrict(ResultOk({ data: 1 })).result()
	 * ```
	 *
	 * @example
	 * ```ts
	 * const result = FlowMatchStrict(ResultError({ tag: 'Failure' }))
	 * 	.error(['Failure'], (current) => current.data)
	 * 	.result()
	 * ```
	 */
	public result(): FlowTrySync<R | L> {
		const result = this.resolveResult((missmatch, result) => {
			return missmatch
				? UtilsErrorRuntime('Non-exhaustive match. The current result variant was not handled.')
				: result
		})
		return result as FlowTrySync<R | L>
	}
}
