import { InternalCreateErrorWith } from '../factories/internal-create-error-with'

export type AbortError<D = unknown> = [D] extends [unknown] ? InternalCreateErrorWith.Return<'AbortError', D> : never
export const AbortError: InternalCreateErrorWith<'AbortError'> = InternalCreateErrorWith('AbortError')
