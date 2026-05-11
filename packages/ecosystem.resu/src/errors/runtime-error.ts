import { InternalErrorWith } from '../factories/internal-create-error-with'
import type { Result } from '../classes/result'

export type RuntimeError<D = Result.AnyData> = [D] extends [unknown] ? InternalErrorWith.Return<'RuntimeError', D> : never
export const RuntimeError: InternalErrorWith<'RuntimeError'> = InternalErrorWith('RuntimeError')
