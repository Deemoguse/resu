# `resu`

[English](README.md) | **Русский**

> [!WARNING]
> **Статус: WIP.** Текущая версия API: `0.0.1`. Публичные имена, типы, import paths и поведение могут изменяться без сохранения обратной совместимости.

`resu` представляет успешные и ошибочные исходы как типизированные значения `Result`. Это позволяет описывать ожидаемые доменные ошибки явно, сужать их средствами TypeScript и объединять несколько операций без обязательного использования `throw`/`catch` в вызывающем коде.

Используйте `resu`, когда ошибка является ожидаемым исходом операции: например, при валидации, поиске отсутствующей сущности или обработке ответа внешнего API. Не скрывайте через `Result` программные ошибки, которые должны быть исправлены в исходном коде.

## Содержание

- [Требования и установка](#требования-и-установка)
- [Быстрый старт](#быстрый-старт)
- [Какой API выбрать](#какой-api-выбрать)
- [Модель Result](#модель-result)
- [Создание и проверка Result](#создание-и-проверка-result)
- [Безопасное выполнение: Flow.Try](#безопасное-выполнение-flowtry)
- [Безопасные функции: Flow.Function](#безопасные-функции-flowfunction)
- [Сопоставление: Flow.Match](#сопоставление-flowmatch)
- [Последовательные вычисления: Runtime](#последовательные-вычисления-runtime)
- [Наблюдение за Result: emitters](#наблюдение-за-result-emitters)
- [Типы и утилиты](#типы-и-утилиты)
- [Точечные импорты](#точечные-импорты)
- [Ограничения WIP](#ограничения-wip)
- [Поддержка и участие](#поддержка-и-участие)
- [Разработка пакета](#разработка-пакета)
- [Лицензия](#лицензия)

## Требования и установка

Установите пакет из npm:

```bash
npm install resu
```

| Среда | Текущий контракт |
|---|---|
| Node.js | Сборка и проверки проекта используют `>=20.19`; отдельная гарантия минимальной runtime-версии пока не объявлена |
| ESM | Доступен через `import` |
| CommonJS | Доступен через `require` |
| TypeScript | Декларации типов входят в пакет |
| Браузер | Совместимость пока не гарантируется; emitters и отмена требуют `EventTarget`, `CustomEvent`, `AbortSignal` и `AbortController` |

Для большинства сценариев используйте пространства имён из корневого entry point:

```ts
import { Flow, Result, Runtime, Utils } from 'resu'
```

CommonJS-подключение предоставляет те же пространства имён:

```js
const { Flow, Result, Runtime, Utils } = require('resu')
```

Точечные импорты перечислены в конце документа.

## Быстрый старт

Следующий пример безопасно разбирает JSON, проверяет структуру данных и возвращает отдельные доменные ошибки для синтаксиса и содержимого:

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

Пример выводит `dark`. Невалидный JSON возвращает `InvalidJson`, а корректный JSON с неподходящей структурой возвращает `InvalidSettings`.

## Какой API выбрать

| Задача | API |
|---|---|
| Создать доменный исход | `Result.Ok`, `Result.Error` |
| Проверить неизвестное значение | `Result.Is`, `Result.IsOk`, `Result.IsError` |
| Безопасно выполнить одну операцию | `Flow.Try` |
| Создать переиспользуемую безопасную функцию | `Flow.Function` |
| Преобразовать результат по статусу или тегу | `Flow.Match` |
| Выполнить зависимые шаги с ранним выходом | `Runtime.Gen` и `Runtime.Unwrap*` |
| Наблюдать за создаваемыми результатами | `Result.Emitters` |

## Модель `Result`

Упрощённая форма ниже объясняет публичные поля, но не является экспортируемым типом:

```ts
type ResultShape =
	| { status: 'ok'; tag: string | null; data: unknown }
	| { status: 'error'; tag: string | null; data: unknown }
```

- `status` определяет успешную или ошибочную ветку;
- `tag` различает доменные варианты внутри ветки, например `UserLoaded` или `NotFound`;
- `data` содержит полезное значение либо сведения об ошибке.

### Как оборачиваются возвращаемые значения

`Flow.Try`, `Flow.Function`, обработчики `Flow.Match` и итоговое значение `Runtime.Gen` используют одно правило нормализации:

| Возвращаемое значение | Итог операции |
|---|---|
| Обычное значение `T` | `Result.Ok` с `data: T` |
| Явный `Result.Ok` | Итоговый `ok` с его `tag` и `data` |
| Явный `Result.Error` | Итоговый `error` с его `tag` и `data` |
| Выброшенное исключение | `error` с тегом `RuntimeError` |
| Отклонённый Promise в async API | `error` с тегом `RuntimeError` |
| Отмена `Flow.Try.Async` через signal | `error` с тегом `AbortError` |

Обычные данные оборачиваются в `Result.Ok`, а явный `Result` становится публичным исходом операции. Его `status`, `tag` и `data` сохраняются и не помещаются в `data` дополнительного `ok`.

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

Публичные типы функций, передаваемых в flow API, не принимают `undefined` и `void`. Для Promise используйте async-вариант соответствующей операции.

## Создание и проверка `Result`

| Операция | Принимает | Возвращает |
|---|---|---|
| `Result.Ok(options)` | Необязательные `tag`, `data`, `emit` | Ветку `ok` |
| `Result.Error(options)` | Необязательные `tag`, `data`, `emit` | Ветку `error` |
| `Result.Is(value)` | `unknown` | Признак любого `Result` |
| `Result.IsOk(value)` | `unknown` | Признак ветки `ok` |
| `Result.IsError(value)` | `unknown` | Признак ветки `error` |
| `Result.OkFrom(value, tag?)` | Обычное значение или `Result` | Ветку `ok` |
| `Result.ErrorFrom(value, tag?)` | Обычное значение или `Result` | Ветку `error` |
| `Result.OkFromUnlessError(value, tag?)` | Обычное значение или `Result` | `ok`, кроме уже полученного `error` |
| `Result.ErrorFromUnlessOk(value, tag?)` | Обычное значение или `Result` | `error`, кроме уже полученного `ok` |

### Создание: `Result.Ok` и `Result.Error`

Оба конструктора принимают объект с необязательными `tag`, `data` и `emit`. Если тег или данные не переданы, соответствующее поле равно `null`.

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

Используйте `tag` как устойчивый идентификатор варианта, а `data` как его типизированную нагрузку.

### Проверка: `Result.Is`, `Result.IsOk`, `Result.IsError`

Функции проверки типов принимают `unknown` и сужают значение до любого `Result` либо до конкретной ветки:

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

Объекта с похожими полями недостаточно: для надёжного распознавания создавайте результаты конструкторами пакета.

### Преобразование: `Result.OkFrom` и `Result.ErrorFrom`

Операции `From` создают выбранную ветку из обычного значения или существующего `Result`. При входном `Result` его `data` сохраняется, а переданный тег заменяет исходный.

```ts
import { Result } from 'resu'

const answer = Result.OkFrom(42, 'Answer')
const rejected = Result.ErrorFrom(answer, 'Rejected')

answer.data    // 42
rejected.tag  // 'Rejected'
rejected.data // 42
```

Если новый тег не указан, для входного `Result` сохраняется прежний тег. Передайте `null`, чтобы явно его сбросить:

```ts
import { Result } from 'resu'

const source = Result.Error({ tag: 'NetworkError', data: 'offline' })

const recovered = Result.OkFrom(source)
const untagged = Result.OkFrom(source, null)

recovered.tag // 'NetworkError'
untagged.tag  // null
```

### Условное преобразование: `FromUnless`

`Result.OkFromUnlessError` создаёт `ok` из обычного значения или входного `ok`, но сохраняет входную ветку `error`. `Result.ErrorFromUnlessOk` действует зеркально: создаёт `error`, кроме случая, когда уже получен `ok`.

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

Эти операции полезны на границе API, когда обычное значение нужно привести к выбранной ветке, не уничтожая уже сформированный противоположный исход.

## Безопасное выполнение: `Flow.Try`

`Flow.Try` выполняет операцию сразу и преобразует её исход в `Result`.

| Вариант | Принимает | Возвращает |
|---|---|---|
| `Flow.Try.Sync(fn)` | Синхронную функцию | `Result` |
| `Flow.Try.Sync({ try, catch? })` | Синхронные основную и резервную функции | `Result` |
| `Flow.Try.Async(fn)` | Синхронную или асинхронную функцию | `Promise<Result>` |
| `Flow.Try.Async({ signal?, try, catch? })` | Функции и необязательный `AbortSignal` | `Promise<Result>` |

### Синхронная операция

Обычное возвращаемое значение становится `ok`. Выброшенное исключение становится `error` с тегом `RuntimeError`:

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

### Явный доменный `Result`

Функция может сама вернуть ожидаемый доменный исход. Такой `Result` не вкладывается в `data` нового `ok`:

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

### Пользовательская обработка исключения

Объектная форма разделяет основную операцию и резервный исход. В `Flow.Try.Sync` функция `catch` вызывается без аргументов; её результат нормализуется по общим правилам:

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

### Асинхронная операция

`Flow.Try.Async` всегда возвращает Promise. После `await` переменная содержит уже разрешившийся `Result`:

```ts
import { Flow, Result } from 'resu'

const countPromise = Flow.Try.Async(() => 3)
const count = await countPromise

if (Result.IsOk(count)) console.log(count.data)
```

При работе с `fetch` проверяйте HTTP-статус отдельно: ответы 4xx и 5xx сами по себе не отклоняют Promise.

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

Замените `https://api.example.com` адресом своего API. Выброшенное исключение и отклонённый Promise преобразуются в `RuntimeError`.

### Отмена через `AbortSignal`

В объектной форме async-операции можно передать `signal`. Тот же signal поступает в функцию `try`, а функция `catch` получает отклонённое или выброшенное значение как `unknown`:

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

Отмена возвращает отдельный тег `AbortError`.

## Безопасные функции: `Flow.Function`

`Flow.Function` создаёт переиспользуемую функцию с теми же аргументами, но с безопасным результатом вызова.

| API | Когда выполняется исходная функция | Результат вызова |
|---|---|---|
| `Flow.Try.Sync(() => value)` | Сразу | `Result` |
| `Flow.Function.Sync(fn)` | При каждом вызове созданной функции | `Result` |
| `Flow.Function.Async(fn)` | При каждом вызове созданной функции | `Promise<Result>` |

### Синхронная функция

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

Обычное значение становится `Result.Ok`, а исключение становится `RuntimeError`.

### Функция с доменными исходами

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

Явный `Result` становится исходом вызова без дополнительного вложения.

### Асинхронная функция

`Flow.Function.Async` принимает синхронную или асинхронную функцию и всегда возвращает функцию с результатом `Promise<Result>`:

```ts
import { Flow, Result } from 'resu'

const readLength = Flow.Function.Async((value: string) => value.length)
const length = await readLength('ready')

if (Result.IsOk(length)) console.log(length.data)
```

Асинхронная функция может вернуть и явный доменный `Result`, как в HTTP-примере для `Flow.Try.Async`. Исключение или отклонённый Promise преобразуются в `RuntimeError`.

## Сопоставление: `Flow.Match`

`Flow.Match` выбирает обработчик по `status` и `tag`. Цепочка выполняется при вызове `.result()`.

| Метод | Назначение |
|---|---|
| `.ok(tags, handler)` | Обработать перечисленные теги ветки `ok` |
| `.error(tags, handler)` | Обработать перечисленные теги ветки `error` |
| `.okAny(handler)` | Обработать любой тег ветки `ok` |
| `.errorAny(handler)` | Обработать любой тег ветки `error` |
| `.any(handler)` | Задать общий резервный обработчик |
| `.result()` | Выполнить сопоставление и получить `Result` |

`Loose` сохраняет исходный `Result`, если обработчик не найден. `Strict` в таком случае возвращает `RuntimeError`.

### Сопоставление по тегу

Пример ниже детерминирован: обе ветки передаются в одну и ту же функцию явно.

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

Обычные значения обработчиков нормализуются как `Result.Ok`.

### Частичное и широкое сопоставление

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

Используйте точные обработчики по тегу раньше широких обработчиков по статусу и общего `.any()`.

### Возврат `Result` из обработчика

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

Явный `Result` из обработчика сохраняет ветку, тег и данные. Исключение внутри обработчика преобразуется в `RuntimeError`.

## Последовательные вычисления: `Runtime`

`Runtime.Gen` объединяет несколько зависимых операций, возвращающих `Result`. `yield* Runtime.Unwrap...` извлекает значение из `ok`; первый `error` немедленно становится итогом всей последовательности.

| Операция | Назначение |
|---|---|
| `Runtime.Gen.Sync(generator)` | Выполнить синхронную последовательность |
| `Runtime.Gen.Async(generator)` | Выполнить асинхронную последовательность |
| `Runtime.Unwrap.Sync(result)` | Извлечь `data` синхронного `ok` |
| `Runtime.Unwrap.Async(result)` | Извлечь `data` из `Result` или `Promise<Result>` |
| `Runtime.UnwrapTagged.Sync(result)` | Извлечь `{ tag, data }` синхронного `ok` |
| `Runtime.UnwrapTagged.Async(result)` | Извлечь `{ tag, data }` из `Result` или `Promise<Result>` |

### Синхронная последовательность

`Runtime.Unwrap.Sync` возвращает поле `data` успешного результата:

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

// ok с data: 240

if (Result.IsOk(total)) console.log(total.data)
```

Обычное итоговое значение генератора оборачивается в `Result.Ok`.

### Ранний выход при `error`

Шаги после первого `error` не выполняются:

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

// error с tag: 'OutOfStock'
```

Возвращённый из генератора явный `Result` также сохраняет свою ветку:

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

### Получение тега и данных

`Runtime.UnwrapTagged.Sync` и `Runtime.UnwrapTagged.Async` возвращают объект `{ tag, data }`, когда следующему шагу нужен тег результата:

```ts
import { Result, Runtime } from 'resu'

const labeled = Runtime.Gen.Sync(function* () {
	const current = yield* Runtime.UnwrapTagged.Sync(
		Result.Ok({ tag: 'CacheHit', data: 42 }),
	)

	return `${current.tag}:${current.data}`
})

// ok с data: 'CacheHit:42'
```

### Преобразование значения вторым аргументом

Все операции семейства `Runtime.Unwrap*` поддерживают форму `(value, map)`:

- `Runtime.Unwrap.Sync`;
- `Runtime.Unwrap.Async`;
- `Runtime.UnwrapTagged.Sync`;
- `Runtime.UnwrapTagged.Async`.

Первым аргументом передайте обычное значение вместо `Result`, а вторым преобразующую функцию, которая создаёт явный `Result`. Эта функция обязана вернуть `Result.Ok` или `Result.Error`: обычное значение не соответствует данной перегрузке.

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

// ok с data: 84

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

// ok с data: 'Length:5'
```

Sync-варианты принимают синхронное значение и синхронную преобразующую функцию. Async-варианты дополнительно принимают Promise и асинхронную функцию. Если преобразование выбросит исключение или вернёт отклонённый Promise, итогом станет `RuntimeError`. Полученный `Result` обрабатывается как обычный шаг: `ok` распаковывается, а `error` завершает последовательность.

### Асинхронная последовательность

В `Runtime.Gen.Async` используйте `Runtime.Unwrap.Async` и `Runtime.UnwrapTagged.Async`. Они принимают `Result` или Promise с `Result`:

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

// ok с data: 'Ready:6'
```

Выброшенное исключение и отклонённый Promise становятся `RuntimeError`. Синхронные варианты `Unwrap` используйте только внутри `Runtime.Gen.Sync`, а асинхронные внутри `Runtime.Gen.Async`.

## Наблюдение за `Result`: emitters

Emitters позволяют централизованно наблюдать за создаваемыми `Result`, например для журналирования или диагностики. Сначала создайте emitter, подпишитесь и зарегистрируйте его:

| Операция | Назначение |
|---|---|
| `new Result.Emitters.Emitter(options)` | Создать emitter с правилами автоматической отправки |
| `Result.Emitters.Add(emitter)` | Зарегистрировать emitter |
| `Result.Emitters.Delete(emitter)` | Удалить emitter и очистить его подписки |
| `emitter.on(handler)` | Подписаться и получить функцию отписки |
| `emitter.emit(result)` | Отправить конкретный `Result` вручную |
| `emitter.off(handler)` | Удалить одну подписку |
| `emitter.offAll()` | Удалить все подписки |

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

`Result.Emitters.Add` включает автоматическую отправку для этого emitter. `Result.Emitters.Delete` удаляет его из общего списка и очищает подписки.

Всегда удаляйте emitter, когда наблюдение больше не требуется. Это особенно важно для долгоживущих процессов и тестов.

### Фильтрация автоматических событий

Параметры `emitOk` и `emitError` принимают `true` либо функцию-предикат. Следующий emitter получает только `ok` с тегом `Audit` и все ошибки:

```ts
import { Result } from 'resu'

const audit = new Result.Emitters.Emitter({
	emitOk: (result) => result.tag === 'Audit',
	emitError: true,
})

Result.Emitters.Add(audit)

Result.Ok({ tag: 'Audit', data: 'saved' })
Result.Ok({ tag: 'Ignored', data: 'draft' }) // не отправляется
Result.Error({ tag: 'Failure', data: 'broken' })

Result.Emitters.Delete(audit)
```

### Ручная отправка и локальное переопределение

`emitter.emit(result)` отправляет конкретный результат вручную. Опция `emit` отдельного `Result` принудительно включает или отключает его автоматическую отправку:

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

`emitter.on()` возвращает функцию отписки и передаёт ту же функцию вторым аргументом обработчика. Для явного управления также доступны `emitter.off(handler)` и `emitter.offAll()`.

## Типы и утилиты

| Тип | Назначение |
|---|---|
| `Result.Any`, `Result.AnyOk`, `Result.AnyError` | Универсальные границы без известных тегов и данных |
| `Flow.Checked<T>` | Итог безопасного выполнения значения `T` |
| `ResultExtract*` | Оставить выбранные варианты union |
| `ResultExclude*` | Исключить выбранные варианты union |
| `Utils.Source<T>` | Описать значение или совместимый `Result` до нормализации |

### Широкие типы `Result.Any*`

`Result.Any`, `Result.AnyOk` и `Result.AnyError` подходят для границ, где конкретные теги и данные заранее неизвестны:

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

Предпочитайте конкретный union доменных результатов внутри приложения, а широкие типы оставляйте для универсальной инфраструктуры.

### Результат безопасного выполнения: `Flow.Checked`

`Flow.Checked<T>` описывает итог flow-операции: нормализованное значение `T`, сохранённый доменный `error` либо возможный `RuntimeError`.

```ts
import { Flow, Result } from 'resu'

type CheckedNumber = Flow.Checked<number>

function readNumber(result: CheckedNumber) {
	return Result.IsOk(result) ? result.data : null
}
```

### Фильтрация union: `ResultExtract*` и `ResultExclude*`

`Extract` оставляет выбранные варианты union, а `Exclude` удаляет их. Общая форма фильтрует по статусу и необязательному тегу; специализированные формы сразу выбирают `ok` или `error`.

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

### Вспомогательные типы `Utils`

```ts
import type { Utils } from 'resu'

type PresentText = Utils.NonUndefined<string | undefined> // string
type SourceNumber = Utils.Source<number>
type SyncSourceNumber = Utils.NonUndefinedSource<number>
type Tags = Utils.NonAmptyArray<'Ready' | 'Cached'>
```

- `Utils.Source<T>` описывает обычное значение или совместимый `Result` до нормализации;
- `Utils.NonUndefinedSource<T>` дополнительно исключает Promise, `undefined` и `void` для sync-контрактов;
- `Utils.NonUndefined<T>` удаляет `undefined` и `void` из типа;
- `Utils.NonAmptyArray<T>` требует хотя бы один элемент.

Написание `NonAmptyArray` соответствует текущему WIP API и может быть исправлено до стабильного релиза.

### Встроенные ошибки

`Utils.RuntimeError` и `Utils.AbortError` создают стандартные ветки `error`. Строка для `RuntimeError` преобразуется в объект `Error`; другие значения сохраняются в `data`.

```ts
import { Utils } from 'resu'

const runtimeFailure = Utils.RuntimeError('Cannot decode response')
const cancelled = Utils.AbortError({ reason: 'cancelled' })

runtimeFailure.tag // 'RuntimeError'
cancelled.tag      // 'AbortError'
```

## Точечные импорты

Для точечного импорта используйте публичные пути из `exports` пакета. Имя прямого экспорта включает группу операции:

```ts
import { FlowFunctionSync } from 'resu/flow-function-sync'
import { FlowTrySync } from 'resu/flow-try-sync'
import { ResultIsOk } from 'resu/result-is-ok'
import { ResultOk } from 'resu/result-ok'
import { RuntimeGenSync } from 'resu/runtime-gen-sync'
import type { ResultExtractOk } from 'resu/result-extract-ok'
```

| Группа | Публичные subpaths | Экспортируемые имена |
|---|---|---|
| Создание `Result` | `result-ok`, `result-error` | `ResultOk`, `ResultError` |
| Преобразование `Result` | `result-ok-from`, `result-error-from`, `result-ok-from-unless-error`, `result-error-from-unless-ok` | `ResultOkFrom`, `ResultErrorFrom`, `ResultOkFromUnlessError`, `ResultErrorFromUnlessOk` |
| Проверка типов | `result-is`, `result-is-ok`, `result-is-error` | `ResultIs`, `ResultIsOk`, `ResultIsError` |
| Безопасное выполнение | `flow-try-sync`, `flow-try-async` | `FlowTrySync`, `FlowTryAsync` |
| Безопасные функции | `flow-function-sync`, `flow-function-async` | `FlowFunctionSync`, `FlowFunctionAsync` |
| Сопоставление | `flow-match-loose`, `flow-match-strict` | `FlowMatchLoose`, `FlowMatchStrict` |
| Последовательности Runtime | `runtime-gen-sync`, `runtime-gen-async`, `runtime-unwrap-sync`, `runtime-unwrap-async`, `runtime-unwrap-tagged-sync`, `runtime-unwrap-tagged-async` | `RuntimeGenSync`, `RuntimeGenAsync`, `RuntimeUnwrapSync`, `RuntimeUnwrapAsync`, `RuntimeUnwrapTaggedSync`, `RuntimeUnwrapTaggedAsync` |
| Emitters | `emitter`, `result-emitters-add`, `result-emitters-delete` | `Emitter`, `ResultEmittersAdd`, `ResultEmittersDelete` |
| Типы результатов | `result-any`, `result-any-ok`, `result-any-error`, `result-extract`, `result-extract-ok`, `result-extract-error`, `result-exclude`, `result-exclude-ok`, `result-exclude-error`, `flow-checked` | `ResultAny`, `ResultAnyOk`, `ResultAnyError`, `ResultExtract`, `ResultExtractOk`, `ResultExtractError`, `ResultExclude`, `ResultExcludeOk`, `ResultExcludeError`, `FlowChecked` |
| Встроенные ошибки | `utils/utils-error-runtime`, `utils/utils-error-abort` | `UtilsErrorRuntime`, `UtilsErrorAbort` |
| Вспомогательные типы | `utils/utils-source`, `utils/utils-non-undefined-source`, `utils/utils-non-undefined`, `utils/utils-non-empty-array` | `UtilsSource`, `UtilsNonUndefinedSource`, `UtilsNonUndefined`, `UtilsNonAmptyArray` |

Для прикладного кода обычно удобнее корневые пространства имён. Точечные пути полезны для библиотечных адаптеров и импортов только типов.

## Ограничения WIP

- Обратная совместимость API, типов, тегов встроенных ошибок и import paths пока не гарантируется.
- Функции проверки типов распознают `Result`, созданные конструкторами пакета; структурно похожего объекта недостаточно.
- Функция, переданная в sync- или async-flow, не должна возвращать `undefined` или `void`: такие контракты отклоняются типами.
- Внутри `Runtime.Gen.Sync` используйте sync-варианты `Unwrap`, а внутри `Runtime.Gen.Async` используйте async-варианты.
- Совместимость с браузерами пока не гарантируется.
- Для emitters и отмены окружение должно предоставлять `EventTarget`, `CustomEvent`, `AbortSignal` и `AbortController`.

## Поддержка и участие

Проект находится в активной WIP-разработке. Отдельный публичный канал поддержки и порядок приёма внешних изменений пока не объявлены. Текущее состояние проекта и изменения API доступны в [репозитории resu](https://github.com/Deemoguse/resu).

Перед использованием в рабочей среде зафиксируйте конкретную версию и проверьте её поведение на своих сценариях.

## Разработка пакета

Этот раздел предназначен для мейнтейнеров. Из корня monorepo выполните:

```bash
npm run build --workspace @wambata/resu
npm run lint --workspace @wambata/resu
npm run test:runtime --workspace @wambata/resu
npm run test:types --workspace @wambata/resu
```

Runtime-поведение проверяется через Vitest, а вывод и сужение TypeScript-типов проверяются через tsd.

## Лицензия

Проект распространяется по [Apache License 2.0](../../LICENSE.md).
