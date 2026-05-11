import { RuntimeGenCreateWith } from '../factories/runtime-gen-create-with'
import type { ResultOkFromUnlessError } from './result-ok-from-unless-error'

export type RuntimeGenAsync<V> =
	[V] extends [unknown]
		? RuntimeGenCreateWith.Return<'async', ResultOkFromUnlessError<V>, V>
		: never

export const RuntimeGenAsync: RuntimeGenCreateWith<'sync'> = RuntimeGenCreateWith('sync')
