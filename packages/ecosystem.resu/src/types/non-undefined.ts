// eslint-disable-next-line @internal/inferization-type, @typescript-eslint/no-invalid-void-type
export type NonUndefined<T> = T & Exclude<T, undefined | void>
