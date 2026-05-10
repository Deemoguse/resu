import { InternalErrorWith } from '../factories/internal-create-error-with'

export type RuntimeError<D = unknown> = [D] extends [unknown] ? InternalErrorWith.Return<'RuntimeError', D> : never
export const RuntimeError: InternalErrorWith<'RuntimeError'> = InternalErrorWith('RuntimeError')
