import { RuntimeUnwrapCreateWith } from '../factories/runtime-unwrap-create-with'
import type { ResultAny } from './result-any'

export type RuntimeUnwrapAsync<R extends ResultAny> =
	[R] extends [unknown]
		? RuntimeUnwrapCreateWith.Return<'async', 'untagged', R>
		: never

export const RuntimeUnwrapAsync: RuntimeUnwrapCreateWith<'async', 'untagged'> = RuntimeUnwrapCreateWith('async', 'untagged')
