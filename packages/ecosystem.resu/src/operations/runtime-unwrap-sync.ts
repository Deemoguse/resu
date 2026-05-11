import { RuntimeUnwrapCreateWith } from '../factories/runtime-unwrap-create-with'
import type { ResultAny } from './result-any'

export type RuntimeUnwrapSync<R extends ResultAny> =
	[R] extends [unknown]
		? RuntimeUnwrapCreateWith.Return<'sync', 'untagged', R>
		: never

export const RuntimeUnwrapSync: RuntimeUnwrapCreateWith<'sync', 'untagged'> = RuntimeUnwrapCreateWith('sync', 'untagged')
