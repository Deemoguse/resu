import { InternalErrorWith } from '../factories/internal-create-error-with'
import type { Result } from '../classes/result'

export type AbortError<D = Result.AnyData> = [D] extends [unknown] ? InternalErrorWith.Return<'AbortError', D> : never
export const AbortError: InternalErrorWith<'AbortError'> = InternalErrorWith('AbortError')
