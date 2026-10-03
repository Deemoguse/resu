import { expectError, expectType } from 'tsd'
import { Result } from '../../src/namespaces/index'

// Options accept booleans or predicates, with broad Result inputs.
{
	const emitter = new Result.Emitters.Emitter({
		emitOk: true,
		emitError: (result) => {
			expectType<Result.Any>(result)
			return result.tag === 'Failure'
		},
	})
	expectType<((result: Result.Any) => boolean) | undefined>(emitter.emitOk)
	expectType<((result: Result.Any) => boolean) | undefined>(emitter.emitError)
	expectError(new Result.Emitters.Emitter())
	expectError(new Result.Emitters.Emitter({ emitOk: 'yes' }))
	expectError(new Result.Emitters.Emitter({ emitError: () => 'yes' }))
}

// Subscriptions expose a Result and an unsubscribe function.
{
	const emitter = new Result.Emitters.Emitter({})
	const off = emitter.on((result, unsubscribe) => {
		expectType<Result.Any>(result)
		expectType<() => void>(unsubscribe)
	})
	expectType<() => void>(off)
	expectType<void>(emitter.off(() => {}))
	expectType<void>(emitter.offAll())
	expectType<void>(emitter.emit(Result.OkFrom(1)))
	expectType<void>(Result.Emitters.Add(emitter))
	expectType<void>(Result.Emitters.Delete(emitter))
	expectError(emitter.on((result: Result.AnyOk) => result.data))
	expectError(emitter.emit(1))
	expectError(Result.Emitters.Add({}))
	expectError(Result.Emitters.Delete({}))
}
