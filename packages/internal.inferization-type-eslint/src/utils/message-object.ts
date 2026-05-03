import type { MessageString } from './message-string'

export type MessageObject<O extends Record<string, string>> = {
	[K in keyof O]: MessageString<O[K]>
} & {
	InferType: {
		[K in keyof O]: MessageString<O[K]>['InferType']
	}
}

export function MessageObject<const T extends Record<string, string>>(messages: T): MessageObject<T> {
	return messages as MessageObject<T>
}
