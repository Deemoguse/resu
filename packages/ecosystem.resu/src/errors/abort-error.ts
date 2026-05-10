import { InternalErrorWith } from '../factories/internal-create-error-with'

export type AbortError<D = unknown> = [D] extends [unknown] ? InternalErrorWith.Return<'AbortError', D> : never
export const AbortError: InternalErrorWith<'AbortError'> = InternalErrorWith('AbortError')
