import { Match } from '../classes/match'
import { RuntimeError } from '../errors/runtime-error'
import type { FlowTrySync } from '../operations/flow-try-sync'
import type { ResultAny } from '../operations/result-any'

export namespace FlowMatchWith {
	export interface LooseKind extends Match.Kind {
		type: FlowMatchLoose<
			this['R'] extends ResultAny ? this['R'] : never,
			this['L'] extends ResultAny ? this['L'] : never
		>
	}

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

export type FlowMatchWith<
	M extends 'loose' | 'strict',
> =
	[M] extends [unknown]
		? <
			R extends ResultAny,
			L extends ResultAny,
		>(
			result: L,
		) => (
			FlowMatchWith.Return<M, R, L>
		)
		: never

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

export class FlowMatchLoose<
	R extends ResultAny = never,
	L extends ResultAny = never,
>
	extends Match<R, L, FlowMatchWith.LooseKind>
{
	constructor(result: L) {
		super(FlowMatchLoose as Match.KindTarget<FlowMatchWith.LooseKind>, result)
	}

	public result(): FlowTrySync<R | L> {
		const result = this.resolveResult((_, result) => result)
		return result.data as FlowTrySync<R | L>
	}
}

export class FlowMatchStrict<
	R extends ResultAny = never,
	L extends ResultAny = never,
>
	extends Match<R, L, FlowMatchWith.LooseKind>
{
	constructor(result: L) {
		super(FlowMatchLoose as Match.KindTarget<FlowMatchWith.LooseKind>, result)
	}

	public result(): FlowTrySync<R | L> {
		const result = this.resolveResult((missmatch, result) => {
			return missmatch
				? RuntimeError('Non-exhaustive match. The current result variant was not handled.')
				: result
		})
		return result.data as FlowTrySync<R | L>
	}
}
