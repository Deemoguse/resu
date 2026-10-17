import { expectError, expectType } from 'tsd'
import { Result } from '../../src/namespaces/index'
import { Emitter } from '../../src/classes/emitter'
import { ResultEmitterSubscribe } from '../../src/operations/result-emitter-subscribe'
import { ResultEmitterUnsubscribe } from '../../src/operations/result-emitter-unsubscribe'

// Subscribers receive any result and an unsubscribe function, with readonly fields.
{
	const off = Result.Emitter.Subscribe((result, unsubscribe) => {
		expectType<Result.Any>(result)
		expectType<() => void>(unsubscribe)
		expectType<void>(unsubscribe())
		expectError(result.status = 'ok')
		expectError(result.tag = 'Changed')
		expectError(result.data = null)
		if (Result.IsOk(result)) expectType<Result.AnyOk>(result)
		if (Result.IsError(result)) expectType<Result.AnyError>(result)
	})
	expectType<() => void>(off)
	expectType<void>(off())
	expectType<void>(Result.Emitter.Unsubscribe(() => {}))
	expectError(Result.Emitter.Subscribe())
	expectError(Result.Emitter.Subscribe({}))
	expectError(Result.Emitter.Subscribe((result: Result.AnyOk) => result.data))
	expectError(Result.Emitter.Subscribe((result: Result.Any, unsubscribe: string) => unsubscribe))
	expectError(Result.Emitter.Unsubscribe({}))
}

// Filtering and lifetime management belong to the callback; no options are accepted.
{
	const callback: Emitter.SubscriberCallback = (result, unsubscribe) => {
		if (result.status !== 'error') return
		unsubscribe()
	}
	expectType<() => void>(Result.Emitter.Subscribe(callback))
	expectError(Result.Emitter.Subscribe(callback, {}))
	expectError(Result.Emitter.Subscribe(callback, { once: true }))
	expectError(Result.Emitter.Subscribe(callback, { signal: new AbortController().signal }))
	expectError(Result.Emitter.Subscribe(callback, { emitOk: true }))
	expectError(Result.Emitter.Subscribe(callback, { emitError: () => true }))
}

// Direct operations and the shared emitter expose the same callback contract.
{
	const callback: Emitter.SubscriberCallback = (result, unsubscribe) => {
		expectType<Result.Any>(result)
		expectType<() => void>(unsubscribe)
	}
	expectType<() => void>(Emitter.subscribe(callback))
	expectType<void>(Emitter.unsubscribe(callback))
	expectType<() => void>(ResultEmitterSubscribe(callback))
	expectType<void>(ResultEmitterUnsubscribe(callback))
	expectError(ResultEmitterSubscribe((result: Result.AnyError) => result.data))
	expectError(ResultEmitterUnsubscribe(1))
	expectError(Emitter.subscribe(callback, { once: true }))
}

// Suppressing events does not change the result shape or payload mutability.
{
	const result = Result.Ok({ data: { nested: { count: 1 } }, emit: false })
	expectType<{ nested: { count: number } }>(result.data)
	expectError(result.data = { nested: { count: 2 } })
	result.data.nested.count = 2
	expectType<() => void>(Result.Emitter.Subscribe(() => result))
	expectType<() => void>(Result.Emitter.Subscribe(async () => result))
}
