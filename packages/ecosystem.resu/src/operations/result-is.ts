import { IsResultWith } from '../factories/result-create-is-result-with'

export type ResultIs<V> = [V] extends [unknown]
	? IsResultWith.Return<'any', V>
	: never

export const ResultIs: IsResultWith<'any'> = IsResultWith('any')
