import { IsResultWith } from '../factories/result-create-is-result-with'

export type ResultIsOk<V> = [V] extends [unknown]
	? IsResultWith.Return<'ok', V>
	: never

export const ResultIsOk: IsResultWith<'ok'> = IsResultWith('ok')
