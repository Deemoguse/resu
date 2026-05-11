import { RuntimeUnwrapCreateWith } from '../factories/runtime-unwrap-create-with'
import type { ResultAny } from './result-any'

export type RuntimeUnwrapTaggedAsync<R extends ResultAny> =
	[R] extends [unknown]
		? RuntimeUnwrapCreateWith.Return<'async', 'tagged', R>
		: never

export const RuntimeUnwrapTaggedAsync: RuntimeUnwrapCreateWith<'async', 'tagged'> = RuntimeUnwrapCreateWith('async', 'tagged')
