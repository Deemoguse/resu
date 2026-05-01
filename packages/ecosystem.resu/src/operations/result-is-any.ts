import { IsResultWith } from '../factories/result-create-is-result-with'

export type ResultIsAny<V> = IsResultWith.Return<'any', V>

export const ResultIsAny: IsResultWith<'any'> = IsResultWith('any')
