import { expectError, expectType } from 'tsd'
import { Flow, Result } from '../../src/namespaces/index'

type Ready = Result.Ok<'Ready', number>
type Other = Result.Ok<'Other', boolean>
type Failure = Result.Error<'Failure', string>
type Untagged = Result.Error<null, Error>
type Input = Ready | Other | Failure | Untagged
declare const input: Input
type SharedOk = Result.Ok<'Shared', number>
type SharedError = Result.Error<'Shared', string>
declare const shared: SharedOk | SharedError

type Text = Result.Ok<'Text', string>
declare const mixed: Ready | Text

// Selectors narrow handler inputs and remove only the variants actually handled.
{
	const ready = Flow.Match.Loose(input).case('ok', 'Ready', (result): string => {
		expectType<Ready>(result)
		return result.data.toString()
	})
	expectType<Flow.Match.Loose<Result.OkFrom<string>, Other | Failure | Untagged>>(ready)
	expectType<Flow.Try.Sync<Result.OkFrom<string> | Other | Failure | Untagged>>(ready.result())

	Flow.Match.Loose(input).case('ok', ['Ready', 'Other'], (result): number => {
		expectType<Ready | Other>(result)
		return Number(result.data)
	})
	Flow.Match.Loose(input).case('error', null, (result): string => {
		expectType<Untagged>(result)
		return result.data.message
	})
}

// Status handlers and any fallback infer exactly the remaining union.
{
	const partial = Flow.Match.Strict(input).case('ok', (result): number => {
		expectType<Ready | Other>(result)
		return Number(result.data)
	})
	expectError(partial.result())
	expectError(partial.result(false))
	expectType<Flow.Try.Sync<Result.OkFrom<number> | Failure | Untagged>>(partial.result(true))

	const complete = partial.case('any', (result): string => {
		expectType<Failure | Untagged>(result)
		return String(result.data)
	})
	expectType<Flow.Match.Strict<Result.OkFrom<number> | Result.OkFrom<string>, never>>(complete)
	expectType<Flow.Try.Sync<Result.OkFrom<number> | Result.OkFrom<string>>>(complete.result())
	expectError(complete.result(true))
	expectError(complete.case('any', () => 1))
}

// Shared tags are handled separately per status, or by an unfiltered fallback.
{
	const okHandled = Flow.Match.Strict(shared).case('ok', 'Shared', (result): string => {
		expectType<SharedOk>(result)
		return result.data.toString()
	})
	expectType<Flow.Match.Strict<Result.OkFrom<string>, SharedError>>(okHandled)
	expectError(okHandled.result())
	const handled = okHandled.case('error', 'Shared', (result): string => {
		expectType<SharedError>(result)
		return result.data.toUpperCase()
	})
	expectType<Flow.Match.Strict<Result.OkFrom<string>, never>>(handled)
	expectType<Flow.Try.Sync<Result.OkFrom<string>>>(handled.result())

	const fallback = Flow.Match.Strict(shared).case('any', (result): boolean => {
		expectType<SharedOk | SharedError>(result)
		return result.status === 'ok'
	})
	expectType<Flow.Match.Strict<Result.OkFrom<boolean>, never>>(fallback)
	expectType<Flow.Try.Sync<Result.OkFrom<boolean>>>(fallback.result())
}

// Any is a fallback only: even valid input tags cannot select variants under it.
{
	expectError(Flow.Match.Loose(input).case('any', 'Ready', () => 1))
	expectError(Flow.Match.Loose(input).case('any', ['Ready', 'Failure'], () => 1))
	expectError(Flow.Match.Loose(input).case('any', null, () => 1))
	expectError(Flow.Match.Loose(input).case('any', [null], () => 1))
	expectError(Flow.Match.Strict(input).case('any', 'Ready', () => 1))
	expectError(Flow.Match.Strict(input).case('any', ['Ready', 'Failure'], () => 1))
	expectError(Flow.Match.Strict(input).case('any', null, () => 1))
	expectError(Flow.Match.Strict(input).case('any', [null], () => 1))
	expectError(Flow.Match.Strict(shared).case<'any', 'Shared', boolean>('any', 'Shared', () => true))
}

// A status-wide handler after a tag case receives only the other payload types.
{
	const ready = Flow.Match.Strict(mixed).case('ok', 'Ready', (result): string => {
		expectType<Ready>(result)
		return result.data.toString()
	})
	const complete = ready.case('ok', (result): string => {
		expectType<Text>(result)
		return result.data.toUpperCase()
	})
	expectType<Flow.Match.Strict<Result.OkFrom<string>, never>>(complete)
	expectType<Flow.Try.Sync<Result.OkFrom<string>>>(complete.result())
}

// Raw values and untagged ResultOk sources have the same accumulated type.
{
	const raw = Flow.Match.Loose(input).case<'ok', 'Ready', Result.OkFrom<number>>('ok', 'Ready', () => 32)
	const wrapped = Flow.Match.Loose(input).case<'ok', 'Ready', Result.OkFrom<number>>('ok', 'Ready', () => Result.OkFrom(32))
	expectType<Flow.Match.Loose<Result.OkFrom<number>, Other | Failure | Untagged>>(raw)
	expectType<Flow.Match.Loose<Result.OkFrom<number>, Other | Failure | Untagged>>(wrapped)

	type HandlerFailure = Result.ErrorFrom<string>
	const error = Flow.Match.Strict(input).case<'ok', 'Ready', HandlerFailure>('ok', 'Ready', () => Result.ErrorFrom('broken'))
	expectType<Flow.Try.Sync<HandlerFailure | Other | Failure | Untagged>>(error.result(true))
	expectError(Flow.Match.Loose(input).case<'ok', 'Ready', HandlerFailure>('ok', 'Ready', () => 'broken'))
}

// Invalid selectors and outputs must fail during compilation.
{
	const ready = Flow.Match.Loose(input).case('ok', 'Ready', () => 1)
	expectError(ready.case('ok', 'Ready', () => 2))
	expectError(Flow.Match.Loose(input).case('ok', 'Failure', () => 1))
	expectError(Flow.Match.Loose(input).case('error', 'Ready', () => 1))
	expectError(Flow.Match.Loose(input).case('any', 'Missing', () => 1))
	expectError(Flow.Match.Loose(input).case('ok', [], () => 1))
	expectError(Flow.Match.Loose(input).case('ok', ['Ready', 'Missing'], () => 1))
	expectError(Flow.Match.Loose(input).case('unknown', () => 1))
	expectError(Flow.Match.Loose(input).case('ok', 'Ready', (result: Failure) => result.data))
	expectError(Flow.Match.Loose(input).case('any', () => undefined))
	expectError(Flow.Match.Strict(input).case('any', () => {}))
	expectError(Flow.Match.Strict(input).case('any', async () => 1))
}
