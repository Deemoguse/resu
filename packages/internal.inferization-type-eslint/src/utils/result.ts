// :))
export type Result<
	S extends 'ok' | 'error',
	T extends null | string,
	D,
> =
	[S, T, D] extends [infer S1, infer T1, infer D1] ? {
		readonly status: S1
		readonly tag: T1
		readonly data: D1
	} : never

export function Result<
	S extends 'ok' | 'error',
	T extends null | string = null,
	D = null,
>(
	status: S,
	tag?: T,
	data?: D,
): (
	Result<S, T, D>
) {
	return {
		status,
		tag: tag ?? null,
		data: data ?? null,
	} as Result<S, T, NoInfer<D>>
}
