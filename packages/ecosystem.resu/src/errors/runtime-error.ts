import { InternalCreateErrorWith } from '../factories/internal-create-error-with'

export type RuntimeError<D = unknown> = [D] extends [unknown] ? InternalCreateErrorWith.Return<'RuntimeError', D> : never
export const RuntimeError: InternalCreateErrorWith<'RuntimeError'> = InternalCreateErrorWith('RuntimeError')
