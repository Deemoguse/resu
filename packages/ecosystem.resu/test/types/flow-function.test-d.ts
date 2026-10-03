import { expectError, expectType } from 'tsd'
import { Flow, Result } from '../../src/namespaces/index'

// Arguments: required, optional, rest, and independent sync/async signatures.
{
	const sync = Flow.Function.Sync((text: string, count: number): number => text.length + count)
	const async = Flow.Function.Async(async (text: string): Promise<number> => text.length)
	const fromSync = Flow.Function.Async((text: string): number => text.length)
	const optional = Flow.Function.Sync((value: number, suffix?: string): string => value + (suffix ?? ''))
	const rest = Flow.Function.Async((...values: number[]): number => values.length)

	expectType<(text: string, count: number) => Flow.Try.Sync<number>>(sync)
	expectType<(text: string) => Flow.Try.Async<number>>(async)
	expectType<(text: string) => Flow.Try.Async<number>>(fromSync)
	expectType<(value: number, suffix?: string) => Flow.Try.Sync<string>>(optional)
	expectType<(...values: number[]) => Flow.Try.Async<number>>(rest)
	expectError(sync('text'))
	expectError(sync(1, 2))
	expectError(async())
	expectError(optional(1, false))
	expectError(rest('text'))
}

// Results: normalization preserves error branches and avoids nested containers.
{
	expectType<() => Flow.Try.Sync<number>>(Flow.Function.Sync(() => Result.OkFrom(32 as number)))
	expectType<() => Flow.Try.Async<number>>(Flow.Function.Async(async () => Result.OkFrom(32 as number)))
	expectType<() => Flow.Try.Sync<Result.ErrorFrom<string>>>(Flow.Function.Sync(() => Result.ErrorFrom('broken' as string)))
	expectType<() => Flow.Try.Async<Result.ErrorFrom<string>>>(Flow.Function.Async(async () => Result.ErrorFrom('broken' as string)))

	expectType<() => Flow.Try.Sync<number>>(Flow.Function.Sync<Result.OkFrom<number>, []>(() => 32))
	expectType<() => Flow.Try.Async<number>>(Flow.Function.Async<Result.OkFrom<number>, []>(async () => 32))
	expectError(Flow.Function.Sync<Result.ErrorFrom<string>, []>(() => 'broken'))
	expectError(Flow.Function.Async<Result.ErrorFrom<string>, []>(async () => 'broken'))
}

// Invalid sources: sync operations reject promises; neither mode accepts absence.
{
	expectError(Flow.Function.Sync(() => undefined))
	expectError(Flow.Function.Sync(() => {}))
	expectError(Flow.Function.Sync(async () => 1))
	expectError(Flow.Function.Async(async () => undefined))
	expectError(Flow.Function.Async(() => {}))
}
