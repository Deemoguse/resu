import { FlowMatchWith } from '../factories/flow-match-create-with'
import type { ResultAny } from './result-any'

export type FlowMatchLoose<
	R extends ResultAny,
	L extends ResultAny,
> =
	[R, L] extends [unknown, unknown]
		? FlowMatchWith.Return<'loose', R, L>
		: never

export const FlowMatchLoose: FlowMatchWith<'loose'> = FlowMatchWith('loose')
