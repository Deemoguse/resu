import { IsResultWith } from '../factories/result-create-is-result-with'

export type ResultIsError<V> = [V] extends [unknown]
	? IsResultWith.Return<'error', V>
	: never

export const ResultIsError: IsResultWith<'error'> = IsResultWith('error')
