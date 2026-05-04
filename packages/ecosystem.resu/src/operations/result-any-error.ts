import { Result } from '../models/result'

export type ResultAnyError = {} & Result<'error', Result.AnyTag, Result.AnyData>
