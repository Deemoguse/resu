import { Result } from '../models/result'

export type ResultAnyOk = Result<'ok', Result.AnyTag, Result.AnyData>
