import { IsResultWith } from '../factories/result-create-is-result-with'

export type ResultIsOk<V> = IsResultWith.Return<'ok', V>

export const ResultIsOk: IsResultWith<'ok'> = IsResultWith('ok')
