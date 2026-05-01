import { IsResultWith } from '../factories/result-create-is-result-with'

export type ResultIsError<V> = IsResultWith.Return<'error', V>

export const ResultIsError: IsResultWith<'error'> = IsResultWith('error')
