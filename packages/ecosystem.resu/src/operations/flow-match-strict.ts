import { FlowMatchWith } from '../factories/flow-match-create-with'
import type { ResultAny } from './result-any'

export type FlowMatchStrict<
	R extends ResultAny,
	L extends ResultAny,
> =
	[R, L] extends [unknown, unknown]
		? FlowMatchWith.Return<'strict', R, L>
		: never

export const FlowMatchStrict: FlowMatchWith<'strict'> = FlowMatchWith('strict')
