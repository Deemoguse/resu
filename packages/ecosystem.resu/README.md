# `resu`

**English** | [Русский](README.ru.md)

> [!WARNING]
> **Status: WIP.** The current API version is `0.0.1`. Public names, types, import paths, and behavior may change without backward compatibility.

`resu` represents successful and failed outcomes as typed `Result` values. It lets you model expected domain errors explicitly, narrow them with TypeScript, and compose operations without requiring `throw`/`catch` in calling code.

Use `resu` when failure is an expected outcome of an operation, such as validation, looking up a missing entity, or handling an external API response. Do not hide programming errors that should be fixed at their source behind `Result`.

## Contents

- [Requirements and installation](#requirements-and-installation)
- [Quick start](#quick-start)
- [Choosing an API](#choosing-an-api)
- [The Result model](#the-result-model)
- [Creating and checking Result values](#creating-and-checking-result-values)
- [Safe execution: Flow.Try](#safe-execution-flowtry)
- [Safe functions: Flow.Function](#safe-functions-flowfunction)
- [Matching: Flow.Match](#matching-flowmatch)
- [Sequential computations: Runtime](#sequential-computations-runtime)
- [Observing Result values: emitters](#observing-result-values-emitters)
- [Types and utilities](#types-and-utilities)
- [Subpath imports](#subpath-imports)
- [WIP limitations](#wip-limitations)
- [Support and contributing](#support-and-contributing)
- [Package development](#package-development)
- [License](#license)

## Requirements and installation

Install the package from npm:

```bash
npm install resu
```

| Environment | Current contract |
|---|---|
| Node.js | Project builds and checks use `>=20.19`; a separate minimum runtime version has not been announced |
| ESM | Available through `import` |
| CommonJS | Available through `require` |
| TypeScript | Type declarations are included in the package |
| Browser | Compatibility is not guaranteed yet; emitters and cancellation require `EventTarget`, `CustomEvent`, `AbortSignal`, and `AbortController` |

For most use cases, import the namespaces from the root entry point:

```ts
import { Flow, Result, Runtime, Utils } from 'resu'
```

The CommonJS entry point provides the same namespaces:

```js
const { Flow, Result, Runtime, Utils } = require('resu')
```

Public subpath imports are listed near the end of this document.

## Quick start

The following example safely parses JSON, validates the data shape, and returns separate domain errors for invalid syntax and invalid content:

```ts
import { Flow, Result } from 'resu'

type Settings = {
	theme: 'dark' | 'light'
}

function isSettings(value: unknown): value is Settings {
	if (value === null || typeof value !== 'object') return false

	const theme = Reflect.get(value, 'theme')
	return theme === 'dark' || theme === 'light'
}

function readSettings(source: string) {
	return Flow.Try.Sync({
		try: () => {
			const value: unknown = JSON.parse(source)

			return isSettings(value)
				? Result.Ok({ tag: 'SettingsLoaded', data: value })
				: Result.Error({ tag: 'InvalidSettings', data: value })
		},
		catch: () => Result.Error({
			tag: 'InvalidJson',
			data: source,
		}),
	})
}

const settings = readSettings('{"theme":"dark"}')

if (Result.IsOk(settings)) {
	console.log(settings.data.theme)
}
else {
	console.error(settings.tag, settings.data)
}
```

This example prints `dark`. Invalid JSON returns `InvalidJson`, while valid JSON with an unexpected shape returns `InvalidSettings`.

## Choosing an API

| Task | API |
|---|---|
| Create a domain outcome | `Result.Ok`, `Result.Error` |
| Check an unknown value | `Result.Is`, `Result.IsOk`, `Result.IsError` |
| Safely execute one operation | `Flow.Try` |
| Create a reusable safe function | `Flow.Function` |
| Transform a result by status or tag | `Flow.Match` |
| Run dependent steps with early exit | `Runtime.Gen` and `Runtime.Unwrap*` |
| Observe created results | `Result.Emitters` |

## The `Result` model

The simplified shape below explains the public fields. It is not an exported type:

```ts
type ResultShape =
	| { status: 'ok'; tag: string | null; data: unknown }
	| { status: 'error'; tag: string | null; data: unknown }
```

- `status` selects the success or error branch;
- `tag` distinguishes domain variants within a branch, such as `UserLoaded` or `NotFound`;
- `data` contains the successful value or error details.

### How returned values are wrapped

`Flow.Try`, `Flow.Function`, `Flow.Match` handlers, and the final value of `Runtime.Gen` use the same normalization rule:

| Returned value | Operation result |
|---|---|
| Plain value `T` | `Result.Ok` with `data: T` |
| Explicit `Result.Ok` | Final `ok` with its `tag` and `data` |
| Explicit `Result.Error` | Final `error` with its `tag` and `data` |
| Thrown exception | `error` tagged `RuntimeError` |
| Rejected Promise in an async API | `error` tagged `RuntimeError` |
| `Flow.Try.Async` cancellation through a signal | `error` tagged `AbortError` |

Plain data is wrapped in `Result.Ok`. An explicit `Result` becomes the public outcome of the operation: its `status`, `tag`, and `data` are preserved instead of being stored in the `data` of another `ok`.

```ts
import { Flow, Result } from 'resu'

const fromValue = Flow.Try.Sync(() => 42)
// ok: { tag: null, data: 42 }

const domainError = Result.Error({
	tag: 'OutOfStock',
	data: { productId: 7 },
})

const fromResult = Flow.Try.Sync(() => domainError)
// error: { tag: 'OutOfStock', data: { productId: 7 } }
```

Public flow callback types do not accept `undefined` or `void`. Use the async variant of an operation for Promises.

## Creating and checking `Result` values

| Operation | Accepts | Returns |
|---|---|---|
| `Result.Ok(options)` | Optional `tag`, `data`, and `emit` | An `ok` branch |
| `Result.Error(options)` | Optional `tag`, `data`, and `emit` | An `error` branch |
| `Result.Is(value)` | `unknown` | Whether the value is any `Result` |
| `Result.IsOk(value)` | `unknown` | Whether the value is an `ok` branch |
| `Result.IsError(value)` | `unknown` | Whether the value is an `error` branch |
| `Result.OkFrom(value, tag?)` | A plain value or `Result` | An `ok` branch |
| `Result.ErrorFrom(value, tag?)` | A plain value or `Result` | An `error` branch |
| `Result.OkFromUnlessError(value, tag?)` | A plain value or `Result` | `ok`, unless the input is already `error` |
| `Result.ErrorFromUnlessOk(value, tag?)` | A plain value or `Result` | `error`, unless the input is already `ok` |

### Creating values: `Result.Ok` and `Result.Error`

Both constructors accept an object with optional `tag`, `data`, and `emit` properties. When a tag or data value is omitted, the corresponding field is `null`.

```ts
import { Result } from 'resu'

const ready = Result.Ok({
	tag: 'Ready',
	data: { id: 42 },
})

const missing = Result.Error({
	tag: 'NotFound',
	data: { id: 42 },
})

ready.status   // 'ok'
missing.status // 'error'

const empty = Result.Ok({})
empty.tag  // null
empty.data // null
```

Use `tag` as a stable variant identifier and `data` as its typed payload.

### Checking values: `Result.Is`, `Result.IsOk`, and `Result.IsError`

The type guards accept `unknown` and narrow it to any `Result` or to a specific branch:

```ts
import { Result } from 'resu'

function printResult(value: unknown) {
	if (!Result.Is(value)) return

	if (Result.IsOk(value)) {
		console.log('ok', value.tag, value.data)
	}
	else if (Result.IsError(value)) {
		console.error('error', value.tag, value.data)
	}
}

printResult(Result.Ok({ data: 42 }))
```

An object with similar fields is not enough. Create results with the package constructors so the guards can recognize them reliably.

### Converting values: `Result.OkFrom` and `Result.ErrorFrom`

The `From` operations create the selected branch from a plain value or an existing `Result`. For a `Result` input, they preserve its `data`; a supplied tag replaces the original tag.

```ts
import { Result } from 'resu'

const answer = Result.OkFrom(42, 'Answer')
const rejected = Result.ErrorFrom(answer, 'Rejected')

answer.data    // 42
rejected.tag  // 'Rejected'
rejected.data // 42
```

When no new tag is supplied, an input `Result` keeps its existing tag. Pass `null` to clear it explicitly:

```ts
import { Result } from 'resu'

const source = Result.Error({ tag: 'NetworkError', data: 'offline' })

const recovered = Result.OkFrom(source)
const untagged = Result.OkFrom(source, null)

recovered.tag // 'NetworkError'
untagged.tag  // null
```

### Conditional conversion: `FromUnless`

`Result.OkFromUnlessError` creates `ok` from a plain value or an input `ok`, but preserves an input `error` branch. `Result.ErrorFromUnlessOk` is the inverse: it creates `error` unless the input is already `ok`.

```ts
import { Result } from 'resu'

const loaded = Result.Ok({ tag: 'Loaded', data: 42 })
const failed = Result.Error({ tag: 'NetworkError', data: 'offline' })

const okValue = Result.OkFromUnlessError('cached', 'CacheHit')
const keptError = Result.OkFromUnlessError(failed, 'Ignored')

const errorValue = Result.ErrorFromUnlessOk('invalid', 'ValidationError')
const keptOk = Result.ErrorFromUnlessOk(loaded, 'Ignored')

okValue.status   // 'ok'
keptError.tag    // 'NetworkError'
errorValue.status // 'error'
keptOk.tag       // 'Loaded'
```

These operations are useful at API boundaries when a plain value must be converted to a selected branch without replacing an already constructed outcome from the opposite branch.

## Safe execution: `Flow.Try`

`Flow.Try` executes an operation immediately and converts its outcome to a `Result`.

| Variant | Accepts | Returns |
|---|---|---|
| `Flow.Try.Sync(fn)` | A synchronous function | `Result` |
| `Flow.Try.Sync({ try, catch? })` | Synchronous primary and fallback functions | `Result` |
| `Flow.Try.Async(fn)` | A synchronous or asynchronous function | `Promise<Result>` |
| `Flow.Try.Async({ signal?, try, catch? })` | Functions and an optional `AbortSignal` | `Promise<Result>` |

### Synchronous operation

A plain returned value becomes `ok`. A thrown exception becomes `error` tagged `RuntimeError`:

```ts
import { Flow, Result } from 'resu'

const parsed = Flow.Try.Sync(() => {
	const value: unknown = JSON.parse('{"count":2}')
	return value
})

const invalid = Flow.Try.Sync(() => JSON.parse('{'))

if (Result.IsOk(parsed)) console.log(parsed.data)
if (Result.IsError(invalid)) console.error(invalid.tag)
```

### Explicit domain `Result`

The function may return an expected domain outcome itself. This `Result` is not nested inside the `data` of a new `ok`:

```ts
import { Flow, Result } from 'resu'

const port = Flow.Try.Sync(() => {
	const value = Number('0')

	return Number.isInteger(value) && value > 0
		? Result.Ok({ tag: 'ValidPort', data: value })
		: Result.Error({ tag: 'InvalidPort', data: value })
})

if (Result.IsError(port)) {
	console.error(port.tag, port.data)
}
```

### Custom exception handling

The object form separates the primary operation from its fallback outcome. In `Flow.Try.Sync`, the `catch` function is called without arguments, and its return value follows the standard normalization rules:

```ts
import { Flow, Result } from 'resu'

const settings = Flow.Try.Sync({
	try: () => JSON.parse('{') as unknown,
	catch: () => Result.Error({
		tag: 'InvalidJson',
		data: 'Cannot parse settings',
	}),
})

if (Result.IsError(settings)) console.error(settings.tag)
```

### Asynchronous operation

`Flow.Try.Async` always returns a Promise. After `await`, the variable contains the resolved `Result`:

```ts
import { Flow, Result } from 'resu'

const countPromise = Flow.Try.Async(() => 3)
const count = await countPromise

if (Result.IsOk(count)) console.log(count.data)
```

When using `fetch`, check the HTTP status separately. Responses in the 4xx and 5xx ranges do not reject the Promise by themselves.

```ts
import { Flow, Result } from 'resu'

const user = await Flow.Try.Async(async () => {
	const response = await fetch('https://api.example.com/users/42')

	if (!response.ok) {
		return Result.Error({
			tag: 'UserRequestFailed',
			data: response.status,
		})
	}

	const data: unknown = await response.json()
	return Result.Ok({ tag: 'UserLoaded', data })
})

if (Result.IsError(user)) console.error(user.tag, user.data)
```

Replace `https://api.example.com` with the address of your API. A thrown exception or rejected Promise becomes `RuntimeError`.

### Cancellation with `AbortSignal`

The object form of an async operation accepts a `signal`. The same signal is passed to `try`, while `catch` receives a rejected or thrown value as `unknown`:

```ts
import { Flow, Result } from 'resu'

const controller = new AbortController()

const responsePromise = Flow.Try.Async({
	signal: controller.signal,
	try: (signal) => fetch('https://api.example.com/items', { signal }),
	catch: (error) => Result.ErrorFrom(error, 'RequestFailed'),
})

controller.abort()

const response = await responsePromise
if (Result.IsError(response)) console.error(response.tag)
```

Cancellation returns the distinct `AbortError` tag.

## Safe functions: `Flow.Function`

`Flow.Function` creates a reusable function with the same arguments and a safe call result.

| API | When the source function runs | Call result |
|---|---|---|
| `Flow.Try.Sync(() => value)` | Immediately | `Result` |
| `Flow.Function.Sync(fn)` | On every call to the created function | `Result` |
| `Flow.Function.Async(fn)` | On every call to the created function | `Promise<Result>` |

### Synchronous function

```ts
import { Flow, Result } from 'resu'

const divide = Flow.Function.Sync((left: number, right: number) => {
	if (right === 0) throw new Error('Division by zero')
	return left / right
})

const quotient = divide(10, 2)
const divisionByZero = divide(10, 0)

if (Result.IsOk(quotient)) console.log(quotient.data)
if (Result.IsError(divisionByZero)) console.error(divisionByZero.tag)
```

A plain value becomes `Result.Ok`, while an exception becomes `RuntimeError`.

### Function with domain outcomes

```ts
import { Flow, Result } from 'resu'

const validateName = Flow.Function.Sync((source: string) => {
	const name = source.trim()

	return name.length > 0
		? Result.Ok({ tag: 'ValidName', data: name })
		: Result.Error({ tag: 'EmptyName', data: source })
})

const valid = validateName(' Ada ')
const invalid = validateName('   ')

if (Result.IsOk(valid)) console.log(valid.data)
if (Result.IsError(invalid)) console.error(invalid.tag)
```

An explicit `Result` becomes the call outcome without additional nesting.

### Asynchronous function

`Flow.Function.Async` accepts a synchronous or asynchronous function and always creates a function that returns `Promise<Result>`:

```ts
import { Flow, Result } from 'resu'

const readLength = Flow.Function.Async((value: string) => value.length)
const length = await readLength('ready')

if (Result.IsOk(length)) console.log(length.data)
```

An asynchronous function can also return an explicit domain `Result`, as shown in the HTTP example for `Flow.Try.Async`. An exception or rejected Promise becomes `RuntimeError`.

## Matching: `Flow.Match`

`Flow.Match` selects a handler by `status` and `tag`. The chain runs when `.result()` is called.

| Method | Purpose |
|---|---|
| `.ok(tags, handler)` | Handle the listed tags from the `ok` branch |
| `.error(tags, handler)` | Handle the listed tags from the `error` branch |
| `.okAny(handler)` | Handle any tag from the `ok` branch |
| `.errorAny(handler)` | Handle any tag from the `error` branch |
| `.any(handler)` | Define a general fallback handler |
| `.result()` | Run the match and return a `Result` |

`Loose` preserves the input `Result` when no handler matches. `Strict` returns `RuntimeError` in that case.

### Matching by tag

The example below is deterministic: both branches are passed to the same function explicitly.

```ts
import { Flow, Result } from 'resu'

const ready = Result.Ok({ tag: 'Ready', data: 2 })
const failure = Result.Error({ tag: 'Failure', data: 'broken' })

type Input = typeof ready | typeof failure

function transform(input: Input) {
	return Flow.Match.Strict(input)
		.ok(['Ready'], (current) => current.data * 2)
		.error(['Failure'], (current) => current.data.toUpperCase())
		.result()
}

const transformedReady = transform(ready)
const transformedFailure = transform(failure)

if (Result.IsOk(transformedReady)) console.log(transformedReady.data)
if (Result.IsOk(transformedFailure)) console.log(transformedFailure.data)
```

Plain handler values are normalized to `Result.Ok`.

### Partial and broad matching

```ts
import { Flow, Result } from 'resu'

const ready = Result.Ok({ tag: 'Ready', data: 2 })
const failure = Result.Error({ tag: 'Failure', data: 'broken' })
type Input = typeof ready | typeof failure

function transformReady(input: Input) {
	return Flow.Match.Loose(input)
		.ok(['Ready'], (current) => current.data * 2)
		.result()
}

function summarize(input: Input) {
	return Flow.Match.Strict(input)
		.okAny((current) => `ok:${String(current.data)}`)
		.errorAny((current) => `error:${String(current.data)}`)
		.result()
}

const unchangedFailure = transformReady(failure)
const summary = summarize(ready)

if (Result.IsError(unchangedFailure)) console.error(unchangedFailure.tag)
if (Result.IsOk(summary)) console.log(summary.data)
```

Register exact tag handlers before broad status handlers and the general `.any()` fallback.

### Returning a `Result` from a handler

```ts
import { Flow, Result } from 'resu'

const recovered = Flow.Match.Strict(
	Result.Error({ tag: 'NotFound', data: { id: 42 } }),
)
	.error(['NotFound'], (current) => Result.Ok({
		tag: 'FallbackUser',
		data: { id: current.data.id, name: 'Guest' },
	}))
	.result()

if (Result.IsOk(recovered)) console.log(recovered.data)
```

An explicit `Result` returned by a handler preserves its branch, tag, and data. An exception inside a handler becomes `RuntimeError`.

## Sequential computations: `Runtime`

`Runtime.Gen` composes dependent operations that return `Result` values. `yield* Runtime.Unwrap...` extracts a value from `ok`; the first `error` immediately becomes the outcome of the entire sequence.

| Operation | Purpose |
|---|---|
| `Runtime.Gen.Sync(generator)` | Run a synchronous sequence |
| `Runtime.Gen.Async(generator)` | Run an asynchronous sequence |
| `Runtime.Unwrap.Sync(result)` | Extract `data` from a synchronous `ok` |
| `Runtime.Unwrap.Async(result)` | Extract `data` from a `Result` or `Promise<Result>` |
| `Runtime.UnwrapTagged.Sync(result)` | Extract `{ tag, data }` from a synchronous `ok` |
| `Runtime.UnwrapTagged.Async(result)` | Extract `{ tag, data }` from a `Result` or `Promise<Result>` |

### Synchronous sequence

`Runtime.Unwrap.Sync` returns the `data` field of a successful result:

```ts
import { Result, Runtime } from 'resu'

const total = Runtime.Gen.Sync(function* () {
	const price = yield* Runtime.Unwrap.Sync(
		Result.Ok({ data: 120 }),
	)

	const quantity = yield* Runtime.Unwrap.Sync(
		Result.Ok({ data: 2 }),
	)

	return price * quantity
})

// ok with data: 240

if (Result.IsOk(total)) console.log(total.data)
```

A plain final generator value is wrapped in `Result.Ok`.

### Early exit on `error`

Steps after the first `error` do not run:

```ts
import { Result, Runtime } from 'resu'

const order = Runtime.Gen.Sync(function* () {
	const product = yield* Runtime.Unwrap.Sync(
		Result.Ok({ data: { id: 7, price: 120 } }),
	)

	const stock = yield* Runtime.Unwrap.Sync(
		Result.Error({
			tag: 'OutOfStock',
			data: { productId: product.id },
		}),
	)

	return { product, stock }
})

// error with tag: 'OutOfStock'
```

An explicit `Result` returned by the generator also preserves its branch:

```ts
import { Result, Runtime } from 'resu'

const rejected = Runtime.Gen.Sync(function* () {
	return Result.Error({
		tag: 'OrderRejected',
		data: { orderId: 10 },
	})
})

if (Result.IsError(rejected)) console.error(rejected.tag)
```

### Extracting the tag and data

`Runtime.UnwrapTagged.Sync` and `Runtime.UnwrapTagged.Async` return `{ tag, data }` when the next step needs the result tag:

```ts
import { Result, Runtime } from 'resu'

const labeled = Runtime.Gen.Sync(function* () {
	const current = yield* Runtime.UnwrapTagged.Sync(
		Result.Ok({ tag: 'CacheHit', data: 42 }),
	)

	return `${current.tag}:${current.data}`
})

// ok with data: 'CacheHit:42'
```

### Mapping a value with the second argument

Every operation in the `Runtime.Unwrap*` family supports the `(value, map)` form:

- `Runtime.Unwrap.Sync`;
- `Runtime.Unwrap.Async`;
- `Runtime.UnwrapTagged.Sync`;
- `Runtime.UnwrapTagged.Async`.

Pass a plain value instead of a `Result` as the first argument. The second argument is a mapping function that creates an explicit `Result`. It must return `Result.Ok` or `Result.Error`; a plain return value does not satisfy this overload.

```ts
import { Result, Runtime } from 'resu'

const mappedSync = Runtime.Gen.Sync(function* () {
	const count = yield* Runtime.Unwrap.Sync(
		'42',
		(source) => {
			const value = Number(source)

			return Number.isFinite(value)
				? Result.Ok({ tag: 'ParsedNumber', data: value })
				: Result.Error({ tag: 'InvalidNumber', data: source })
		},
	)

	return count * 2
})

// ok with data: 84

const mappedAsync = await Runtime.Gen.Async(async function* () {
	const current = yield* Runtime.UnwrapTagged.Async(
		Promise.resolve('ready'),
		async (source) => Result.Ok({
			tag: 'Length',
			data: source.length,
		}),
	)

	return `${current.tag}:${current.data}`
})

// ok with data: 'Length:5'
```

Sync variants accept a synchronous value and synchronous mapping function. Async variants additionally accept a Promise and an asynchronous mapping function. If mapping throws or returns a rejected Promise, the outcome is `RuntimeError`. The returned `Result` is processed like any other runtime step: `ok` is unwrapped, while `error` ends the sequence.

### Asynchronous sequence

Inside `Runtime.Gen.Async`, use `Runtime.Unwrap.Async` and `Runtime.UnwrapTagged.Async`. They accept a `Result` or a Promise that resolves to a `Result`:

```ts
import { Result, Runtime } from 'resu'

const asyncResult = await Runtime.Gen.Async(async function* () {
	const count = yield* Runtime.Unwrap.Async(
		Promise.resolve(Result.Ok({
			tag: 'Mapped',
			data: 5,
		})),
	)

	const current = yield* Runtime.UnwrapTagged.Async(
		Promise.resolve(Result.Ok({
			tag: 'Ready',
			data: count + 1,
		})),
	)

	return `${current.tag}:${current.data}`
})

// ok with data: 'Ready:6'
```

A thrown exception or rejected Promise becomes `RuntimeError`. Use synchronous `Unwrap` variants only inside `Runtime.Gen.Sync`, and asynchronous variants only inside `Runtime.Gen.Async`.

## Observing `Result` values: emitters

Emitters provide a central way to observe created `Result` values, for example for logging or diagnostics. Create an emitter, subscribe to it, and register it:

| Operation | Purpose |
|---|---|
| `new Result.Emitters.Emitter(options)` | Create an emitter with automatic emission rules |
| `Result.Emitters.Add(emitter)` | Register an emitter |
| `Result.Emitters.Delete(emitter)` | Remove an emitter and clear its subscriptions |
| `emitter.on(handler)` | Subscribe and receive an unsubscribe function |
| `emitter.emit(result)` | Emit a specific `Result` manually |
| `emitter.off(handler)` | Remove one subscription |
| `emitter.offAll()` | Remove all subscriptions |

```ts
import { Result } from 'resu'

const emitter = new Result.Emitters.Emitter({
	emitError: true,
})

const off = emitter.on((result) => {
	console.log(result.status, result.tag, result.data)
})

Result.Emitters.Add(emitter)

Result.Error({
	tag: 'SaveFailed',
	data: { id: 42 },
})

off()
Result.Emitters.Delete(emitter)
```

`Result.Emitters.Add` enables automatic emission through this emitter. `Result.Emitters.Delete` removes it from the global list and clears its subscriptions.

Always remove an emitter when it is no longer needed. This is particularly important in long-running processes and tests.

### Filtering automatic events

The `emitOk` and `emitError` options accept either `true` or a predicate. The following emitter receives only `ok` values tagged `Audit` and all errors:

```ts
import { Result } from 'resu'

const audit = new Result.Emitters.Emitter({
	emitOk: (result) => result.tag === 'Audit',
	emitError: true,
})

Result.Emitters.Add(audit)

Result.Ok({ tag: 'Audit', data: 'saved' })
Result.Ok({ tag: 'Ignored', data: 'draft' }) // not emitted
Result.Error({ tag: 'Failure', data: 'broken' })

Result.Emitters.Delete(audit)
```

### Manual emission and local overrides

`emitter.emit(result)` emits a specific result manually. The `emit` option on an individual `Result` forces automatic emission on or off:

```ts
import { Result } from 'resu'

const events = new Result.Emitters.Emitter({ emitError: true })

Result.Emitters.Add(events)

events.emit(Result.Ok({
	tag: 'Manual',
	data: 1,
}))

Result.Ok({
	data: 'force emission',
	emit: true,
})

Result.Error({
	data: 'suppress emission',
	emit: false,
})

Result.Emitters.Delete(events)
```

`emitter.on()` returns an unsubscribe function and passes the same function to the handler as its second argument. For explicit subscription management, use `emitter.off(handler)` and `emitter.offAll()`.

## Types and utilities

| Type | Purpose |
|---|---|
| `Result.Any`, `Result.AnyOk`, `Result.AnyError` | Generic boundaries without known tags or data |
| `Flow.Checked<T>` | The safely executed outcome of `T` |
| `ResultExtract*` | Keep selected variants from a union |
| `ResultExclude*` | Remove selected variants from a union |
| `Utils.Source<T>` | Describe a value or compatible `Result` before normalization |

### Broad `Result.Any*` types

`Result.Any`, `Result.AnyOk`, and `Result.AnyError` are suitable at boundaries where specific tags and data are not known in advance:

```ts
import { Result } from 'resu'

function logResult(result: Result.Any) {
	if (Result.IsOk(result)) logSuccess(result)
	else logFailure(result)
}

function logSuccess(result: Result.AnyOk) {
	console.log(result.tag, result.data)
}

function logFailure(result: Result.AnyError) {
	console.error(result.tag, result.data)
}
```

Prefer a specific union of domain results inside application code. Reserve broad types for generic infrastructure.

### Safe execution result: `Flow.Checked`

`Flow.Checked<T>` describes the outcome of a flow operation: a normalized `T`, a preserved domain `error`, or a possible `RuntimeError`.

```ts
import { Flow, Result } from 'resu'

type CheckedNumber = Flow.Checked<number>

function readNumber(result: CheckedNumber) {
	return Result.IsOk(result) ? result.data : null
}
```

### Filtering unions: `ResultExtract*` and `ResultExclude*`

`Extract` keeps selected union variants, while `Exclude` removes them. The general form filters by status and an optional tag; specialized forms select `ok` or `error` directly.

```ts
import type { ResultError } from 'resu/result-error'
import type { ResultExclude } from 'resu/result-exclude'
import type { ResultExcludeError } from 'resu/result-exclude-error'
import type { ResultExcludeOk } from 'resu/result-exclude-ok'
import type { ResultExtract } from 'resu/result-extract'
import type { ResultExtractError } from 'resu/result-extract-error'
import type { ResultExtractOk } from 'resu/result-extract-ok'
import type { ResultOk } from 'resu/result-ok'

type DomainResult =
	| ResultOk<'Ready', number>
	| ResultOk<'Cached', number>
	| ResultError<'NotFound', string>
	| ResultError<'Invalid', Error>

type Successes = ResultExtractOk<DomainResult>
type Failures = ResultExtractError<DomainResult>
type Ready = ResultExtract<DomainResult, 'ok', 'Ready'>

type WithoutSuccesses = ResultExcludeOk<DomainResult>
type WithoutFailures = ResultExcludeError<DomainResult>
type WithoutNotFound = ResultExclude<DomainResult, 'error', 'NotFound'>
```

### `Utils` helper types

```ts
import type { Utils } from 'resu'

type PresentText = Utils.NonUndefined<string | undefined> // string
type SourceNumber = Utils.Source<number>
type SyncSourceNumber = Utils.NonUndefinedSource<number>
type Tags = Utils.NonAmptyArray<'Ready' | 'Cached'>
```

- `Utils.Source<T>` describes a plain value or compatible `Result` before normalization;
- `Utils.NonUndefinedSource<T>` additionally excludes Promises, `undefined`, and `void` from synchronous contracts;
- `Utils.NonUndefined<T>` removes `undefined` and `void` from a type;
- `Utils.NonAmptyArray<T>` requires at least one item.

The `NonAmptyArray` spelling reflects the current WIP API and may be corrected before a stable release.

### Built-in errors

`Utils.RuntimeError` and `Utils.AbortError` create standard `error` branches. A string passed to `RuntimeError` is converted to an `Error` object; other values are preserved in `data`.

```ts
import { Utils } from 'resu'

const runtimeFailure = Utils.RuntimeError('Cannot decode response')
const cancelled = Utils.AbortError({ reason: 'cancelled' })

runtimeFailure.tag // 'RuntimeError'
cancelled.tag      // 'AbortError'
```

## Subpath imports

For focused imports, use the public paths from the package `exports` map. A direct export name includes its operation group:

```ts
import { FlowFunctionSync } from 'resu/flow-function-sync'
import { FlowTrySync } from 'resu/flow-try-sync'
import { ResultIsOk } from 'resu/result-is-ok'
import { ResultOk } from 'resu/result-ok'
import { RuntimeGenSync } from 'resu/runtime-gen-sync'
import type { ResultExtractOk } from 'resu/result-extract-ok'
```

| Group | Public subpaths | Exported names |
|---|---|---|
| Creating a `Result` | `result-ok`, `result-error` | `ResultOk`, `ResultError` |
| Converting a `Result` | `result-ok-from`, `result-error-from`, `result-ok-from-unless-error`, `result-error-from-unless-ok` | `ResultOkFrom`, `ResultErrorFrom`, `ResultOkFromUnlessError`, `ResultErrorFromUnlessOk` |
| Type guards | `result-is`, `result-is-ok`, `result-is-error` | `ResultIs`, `ResultIsOk`, `ResultIsError` |
| Safe execution | `flow-try-sync`, `flow-try-async` | `FlowTrySync`, `FlowTryAsync` |
| Safe functions | `flow-function-sync`, `flow-function-async` | `FlowFunctionSync`, `FlowFunctionAsync` |
| Matching | `flow-match-loose`, `flow-match-strict` | `FlowMatchLoose`, `FlowMatchStrict` |
| Runtime sequences | `runtime-gen-sync`, `runtime-gen-async`, `runtime-unwrap-sync`, `runtime-unwrap-async`, `runtime-unwrap-tagged-sync`, `runtime-unwrap-tagged-async` | `RuntimeGenSync`, `RuntimeGenAsync`, `RuntimeUnwrapSync`, `RuntimeUnwrapAsync`, `RuntimeUnwrapTaggedSync`, `RuntimeUnwrapTaggedAsync` |
| Emitters | `emitter`, `result-emitters-add`, `result-emitters-delete` | `Emitter`, `ResultEmittersAdd`, `ResultEmittersDelete` |
| Result types | `result-any`, `result-any-ok`, `result-any-error`, `result-extract`, `result-extract-ok`, `result-extract-error`, `result-exclude`, `result-exclude-ok`, `result-exclude-error`, `flow-checked` | `ResultAny`, `ResultAnyOk`, `ResultAnyError`, `ResultExtract`, `ResultExtractOk`, `ResultExtractError`, `ResultExclude`, `ResultExcludeOk`, `ResultExcludeError`, `FlowChecked` |
| Built-in errors | `utils/utils-error-runtime`, `utils/utils-error-abort` | `UtilsErrorRuntime`, `UtilsErrorAbort` |
| Helper types | `utils/utils-source`, `utils/utils-non-undefined-source`, `utils/utils-non-undefined`, `utils/utils-non-empty-array` | `UtilsSource`, `UtilsNonUndefinedSource`, `UtilsNonUndefined`, `UtilsNonAmptyArray` |

Root namespaces are usually more convenient in application code. Subpath imports are useful for library adapters and type-only imports.

## WIP limitations

- Backward compatibility is not yet guaranteed for APIs, types, built-in error tags, or import paths.
- Type guards recognize `Result` values created by package constructors; a structurally similar object is not sufficient.
- A function passed to a synchronous or asynchronous flow must not return `undefined` or `void`; the types reject these contracts.
- Use synchronous `Unwrap` variants inside `Runtime.Gen.Sync` and asynchronous variants inside `Runtime.Gen.Async`.
- Browser compatibility is not guaranteed yet.
- Emitters and cancellation require the environment to provide `EventTarget`, `CustomEvent`, `AbortSignal`, and `AbortController`.

## Support and contributing

The project is under active WIP development. A dedicated public support channel and a process for accepting external contributions have not been announced. Track the current project state and API changes in the [resu repository](https://github.com/Deemoguse/resu).

Before using the package in production, pin a specific version and verify its behavior against your use cases.

## Package development

This section is for maintainers. Run the following commands from the monorepo root:

```bash
npm run build --workspace @wambata/resu
npm run lint --workspace @wambata/resu
npm run test:runtime --workspace @wambata/resu
npm run test:types --workspace @wambata/resu
```

Vitest verifies runtime behavior, while tsd verifies TypeScript inference and narrowing.

## License

This project is distributed under the [Apache License 2.0](../../LICENSE.md).
