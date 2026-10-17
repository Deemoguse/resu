import { describe, expect, it, vi } from 'vitest'
import { Result, Runtime } from '../../src/namespaces/index'
import { expectErrorResult, expectResult } from './helpers/result-assertions'

describe('Runtime.Unwrap.Sync', () => {
	it('yields the original result once and returns its payload', () => {
		const input = Result.Ok({ tag: 'Ready', data: { id: 1 } })
		const iterator = Runtime.Unwrap.Sync(input)
		expect(iterator.next()).toEqual({ done: false, value: input })
		expect(iterator.next()).toEqual({ done: true, value: input.data })
		expect(iterator.next()).toEqual({ done: true, value: undefined })
	})

	it('evaluates the mapper lazily and exactly once', () => {
		const mapper = vi.fn((value: number) => Result.Ok({ tag: 'Mapped', data: value * 2 }))
		const iterator = Runtime.Unwrap.Sync(3, mapper)
		expect(mapper).not.toHaveBeenCalled()
		const first = iterator.next()
		expectResult(first.value, { status: 'ok', tag: 'Mapped', data: 6 })
		expect(mapper).toHaveBeenCalledExactlyOnceWith(3)
		expect(iterator.next()).toEqual({ done: true, value: 6 })
		expect(mapper).toHaveBeenCalledTimes(1)
	})

	it('skips the mapper for an existing result', () => {
		const input = Result.Ok({ data: 3 })
		const mapper = vi.fn(() => Result.Ok({ data: 99 }))
		const iterator = Runtime.Unwrap.Sync(input, mapper)
		expect(iterator.next().value).toBe(input)
		expect(mapper).not.toHaveBeenCalled()
	})

	it('yields a domain error from the mapper', () => {
		const iterator = Runtime.Unwrap.Sync('invalid', () => Result.Error({ tag: 'Invalid', data: 'invalid' }))
		expectResult(iterator.next().value, { status: 'error', tag: 'Invalid', data: 'invalid' })
	})

	it('yields RuntimeError when the mapper throws', () => {
		const error = new Error('mapper failed')
		const iterator = Runtime.Unwrap.Sync(1, (): Result.Any => { throw error })
		expect(expectErrorResult(iterator.next().value, 'RuntimeError').data).toBe(error)
	})

	it('yields RuntimeError for a plain value without a mapper from JavaScript', () => {
		const unwrap = Runtime.Unwrap.Sync as unknown as (value: unknown) => Generator<Result.Any>
		expect(expectErrorResult(unwrap('invalid').next().value, 'RuntimeError').data).toBeInstanceOf(Error)
	})
})

describe('Runtime.UnwrapTagged.Sync', () => {
	it.each(['Ready', null])('returns only tag and payload for tag %j', (tag) => {
		const input = Result.Ok({ tag, data: { id: 1 } })
		const iterator = Runtime.UnwrapTagged.Sync(input)
		expect(iterator.next().value).toBe(input)
		const completed = iterator.next()
		expect(completed).toEqual({ done: true, value: { tag, data: input.data } })
		expect(completed.value?.data).toBe(input.data)
	})

	it('returns the mapped tag and payload', () => {
		const iterator = Runtime.UnwrapTagged.Sync(2, (value) => Result.Ok({ tag: 'Mapped', data: value * 2 }))
		expectResult(iterator.next().value, { status: 'ok', tag: 'Mapped', data: 4 })
		expect(iterator.next()).toEqual({ done: true, value: { tag: 'Mapped', data: 4 } })
	})
})

describe('Runtime.Unwrap.Async', () => {
	it('accepts an immediate result and returns an async iterator', async () => {
		const input = Result.Ok({ tag: 'Ready', data: 3 })
		const iterator = Runtime.Unwrap.Async(input)
		expect(await iterator.next()).toEqual({ done: false, value: input })
		expect(await iterator.next()).toEqual({ done: true, value: 3 })
		expect(await iterator.next()).toEqual({ done: true, value: undefined })
	})

	it('awaits a promised result', async () => {
		const input = Result.Ok({ tag: 'Ready', data: { id: 1 } })
		const iterator = Runtime.Unwrap.Async(Promise.resolve(input))
		expect((await iterator.next()).value).toBe(input)
		expect(await iterator.next()).toEqual({ done: true, value: input.data })
	})

	it('awaits both the source value and the mapped result', async () => {
		const mapper = vi.fn(async (value: string) => Result.Ok({ tag: 'Mapped', data: value.length }))
		const iterator = Runtime.Unwrap.Async(Promise.resolve('ready'), mapper)
		expect(mapper).not.toHaveBeenCalled()
		expectResult((await iterator.next()).value, { status: 'ok', tag: 'Mapped', data: 5 })
		expect(mapper).toHaveBeenCalledExactlyOnceWith('ready')
		expect(await iterator.next()).toEqual({ done: true, value: 5 })
	})

	it('accepts a synchronous mapper', async () => {
		const iterator = Runtime.Unwrap.Async(3, (value) => Result.Ok({ data: value * 2 }))
		expectResult((await iterator.next()).value, { status: 'ok', tag: null, data: 6 })
	})

	it('skips the mapper for an existing result', async () => {
		const input = Result.Ok({ data: 3 })
		const mapper = vi.fn(() => Result.Ok({ data: 99 }))
		const iterator = Runtime.Unwrap.Async(Promise.resolve(input), mapper)
		expect((await iterator.next()).value).toBe(input)
		expect(mapper).not.toHaveBeenCalled()
	})

	it('yields a domain error from the mapper', async () => {
		const iterator = Runtime.Unwrap.Async('invalid', async () => Result.Error({ tag: 'Invalid', data: 'invalid' }))
		expectResult((await iterator.next()).value, { status: 'error', tag: 'Invalid', data: 'invalid' })
	})

	it('yields RuntimeError when the mapper throws synchronously', async () => {
		const error = new Error('mapper threw')
		const iterator = Runtime.Unwrap.Async<number, Result.Any>(1, () => { throw error })
		expect(expectErrorResult((await iterator.next()).value, 'RuntimeError').data).toBe(error)
	})

	it('yields RuntimeError when the mapper rejects', async () => {
		const error = new Error('mapper rejected')
		const iterator = Runtime.Unwrap.Async(1, () => Promise.reject(error) as Promise<Result.Any>)
		expect(expectErrorResult((await iterator.next()).value, 'RuntimeError').data).toBe(error)
	})

	it('propagates a rejected source Promise to the consuming runtime', async () => {
		const error = new Error('source rejected')
		const iterator = Runtime.Unwrap.Async(Promise.reject(error) as Promise<Result.Any>)
		await expect(iterator.next()).rejects.toBe(error)
	})

	it('yields RuntimeError for a plain value without a mapper from JavaScript', async () => {
		const unwrap = Runtime.Unwrap.Async as unknown as (value: unknown) => AsyncGenerator<Result.Any>
		expect(expectErrorResult((await unwrap(Promise.resolve('invalid')).next()).value, 'RuntimeError').data).toBeInstanceOf(Error)
	})
})

describe('Runtime.UnwrapTagged.Async', () => {
	it.each(['Ready', null])('returns only tag and payload for tag %j', async (tag) => {
		const input = Result.Ok({ tag, data: { id: 1 } })
		const iterator = Runtime.UnwrapTagged.Async(Promise.resolve(input))
		expect((await iterator.next()).value).toBe(input)
		expect(await iterator.next()).toEqual({ done: true, value: { tag, data: input.data } })
	})

	it('returns the mapped tag and payload', async () => {
		const iterator = Runtime.UnwrapTagged.Async(2, async (value) => Result.Ok({ tag: 'Mapped', data: value * 2 }))
		expectResult((await iterator.next()).value, { status: 'ok', tag: 'Mapped', data: 4 })
		expect(await iterator.next()).toEqual({ done: true, value: { tag: 'Mapped', data: 4 } })
	})
})
