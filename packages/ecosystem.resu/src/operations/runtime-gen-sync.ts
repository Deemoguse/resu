import { RuntimeGenCreateWith } from '../factories/runtime-gen-create-with'
import type { ResultOkFromUnlessError } from './result-ok-from-unless-error'

export type RuntimeGenSync<V> =
	[V] extends [unknown]
		? RuntimeGenCreateWith.Return<'sync', ResultOkFromUnlessError<V>, V>
		: never

export const RuntimeGenSync: RuntimeGenCreateWith<'sync'> = RuntimeGenCreateWith('sync')
