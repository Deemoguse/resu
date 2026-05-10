import { Result } from '../classes/result'

export type ResultAnyError = {} & Result<'error', Result.AnyTag, Result.AnyData>
