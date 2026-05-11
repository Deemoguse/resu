import { RuntimeUnwrapCreateWith } from '../factories/runtime-unwrap-create-with'
import type { ResultAny } from './result-any'

export type RuntimeUnwrapTaggedSync<R extends ResultAny> =
	[R] extends [unknown]
		? RuntimeUnwrapCreateWith.Return<'sync', 'tagged', R>
		: never

export const RuntimeUnwrapTaggedSync: RuntimeUnwrapCreateWith<'sync', 'tagged'> = RuntimeUnwrapCreateWith('sync', 'tagged')
