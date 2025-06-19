# resu ✨

**resu** is a TypeScript/JavaScript library designed for unified result (success/error) handling, logging, flow control, and safe code execution. It is built around the idea of "explicit results" (Result) and provides convenient utilities:

1. `Result` — a core module for describing and creating two types of outcomes: "Success" (`Ok`) and "Error" (`Error`).

2. `Try` — a module for safely running synchronous and asynchronous operations with error interception, returning results in `Result` format.

3. `Flow` — a module that allows you to "match" the obtained result with given handlers (`SyncMatch` and `AsyncMatch`).

4. `Logger` — a module for logging `Result`.



## 🚀 Quick Start

Install the library:

```bash
npm install resu
# or
yarn add resu
```

### 🏗️ Create First Program

Создайта вашу первую программу, которая использует `Result`:

```ts
import { Flow, Result } from 'resu'
import { someService } from 'some-service'

export type SomeEntity = {
	id: number,
	name: string,
}

export const validateSome = Flow.Function.Sync((some: SomeEntity) => {
	if (typeof some.id !== 'number') {
		return Result.Error({ tag: 'InvalidIdType' })
	}
	if (typeof some.name !== 'string') {
		return Result.Error({ tag: 'InvalidNameType' })
	}
	return Result.OkFrom(some)
})

export const updateSome = Flow.Function.Async(async (some: SomeEntity) => {
	const someExist = someService.existById(some.id)
	if (!someExist) return Result.Error({ tag: 'NotFound' })

	const validate = validateSome(some)
	if (validate.status === 'error') return Result.Error({ tag: 'InvalidEntity' })

	const update = Flow.Try.Async(() => someService.updateSome(okResult.data))
	if (update.status === 'error') return Result.Error({ tag: 'UpdateError' })

	return Result.Ok()
}
```


## Result ⚙️

`Result` — это пространство имён, лежащее в основе библиотеки. Оно содержит
методы и утилитарные типы для создания и обработки экземпляров `Result`.
В большинстве случаев каждому методу соответствует одноимённый утилитарный тип.

### 🛠 Часто используемые методы

* ✅ `Result.Ok`, `Result.OkFrom` — для создания успешных результатов.
* ❌ `Result.Error`, `Result.ErrorFrom` — для создания результатов с ошибкой.

---

### 🧱 Создание экземпляров

Создание экземпляра `Result` осуществляется с помощью функций
`Result.Ok()` и `Result.Error()`. Обе принимают объект
с необязательными полями:

* **`data`** — данные, возвращаемые операцией;
* **`tag`** — произвольный тег, идентифицирующий тип результата;
* **`log`** — флаг (`boolean`), указывающий, следует ли логировать результат.

Методы возвращают объект `Result` со следующими полями:

1. **`status`** — статус выполнения (`'ok'` или `'error'`), определяемый
   фабричными методами.
2. **`data`** — полезная нагрузка результата (или `null`, если не указана).
3. **`tag`** — семантический тег (или `null`, если не задан).

---

### 🍬 Синтаксический сахар

Методы `Result.OkFrom` и `Result.ErrorFrom` — это синтаксический сахар,
позволяющий создавать результат, передавая значение первым аргументом и,
при необходимости, тег — вторым. Если переданное значение уже является
экземпляром `Result`, из него извлекается только `data`.

```ts
const res = Result.Ok({ data: 'foo', tag: 'SomeTag' });
const err = Result.ErrorFrom(res);
// => { status: 'error', data: 'foo' } — тег не наследуется
```

---

### 📋 Все методы и типы

Кроме упомянутых методов, существуют и другие:

> **Важно**: Многие утилиты имеют двойственную природу — они представлены
> как типы и как *runtime-функции*, которые проверяют значение в процессе
> выполнения и сужают типы.


#### ✅ Группа "Ok":
| 🧩 Имя метода или типа | 📦 Тип сущности | ⚙️ Сигнатура                                          | 📖 Описание                                                      |
| ---------------------- | --------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| `Ok`                   | тип + метод     | `Result.Ok<[Data][, Tag]>` <br> `Result.Ok([params])`  | ❌ Создает успешный результат с необязательными данными и тегом. |
| `IsOk`                 | тип + метод     | `Result.IsOk<Value>` <br> `Result.IsOk(value)`         | 🔍 Проверяет, является ли значение успешным результатом.         |
| `OkFrom`               | тип + метод     | `Result.OkFrom<Value>` <br> `Result.OkFrom(value)`     | 🔁 Создает успешный результат из переданного значения.           |
| `TaggedOk`             | тип             | ---                                                    | 🏷️ Успешный результат с тегом и без данных.                      |
| `AnyOk`                | тип             | ---                                                    | 🧩 Успешный результат с любыми данными и любым тегом.            |

#### ❌ Группа "Error":
| 🧩 Имя метода или типа | 📦 Тип сущности | ⚙️ Сигнатура                                               | 📖 Описание                                                       |
| ---------------------- | --------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| `Error`                | тип + метод     | `Result.Error<[Data][, Tag]>` <br> `Result.Error([params])` | ❌ Создает результат с ошибкой с необязательными данными и тегом. |
| `IsError`              | тип + метод     | `Result.IsError<Value>` <br> `Result.IsError(value)`        | 🔍 Проверяет, является ли значение ошибкой.                       |
| `ErrorFrom`            | тип + метод     | `Result.ErrorFrom<Value>` <br> `Result.ErrorFrom(value)`    | 🔁 Создает ошибку из переданного значения.                        |
| `TaggedError`          | тип             | ---                                                         | 🏷️ Ошибка с тегом и без данных.                                   |
| `AnyError`             | тип             | ---                                                         | 🧩 Ошибка с любыми данными и любым тегом.                         |

#### 🔀 Общее:
| 🧩 Имя метода или типа | 📦 Тип сущности | ⚙️ Сигнатура                                          | 📖 Описание                                                  |
| ---------------------- | --------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| `IsResult`             | тип + метод     | `Result.IsResult<Value>` <br> `Result.IsResult(value)` | 🔍 Проверяет, является ли значение `Result`.                 |
| `Any`                  | тип             | ---                                                    | 🔀 Результат любого типа: успех (`Ok`) или ошибка (`Error`). |

