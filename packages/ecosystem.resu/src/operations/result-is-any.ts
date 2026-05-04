import { IsResultWith } from '../factories/result-create-is-result-with'

export type ResultIsAny<V> = [V] extends [unknown]
	? IsResultWith.Return<'any', V>
	: never

export const ResultIsAny: IsResultWith<'any'> = IsResultWith('any')
