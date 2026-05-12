import { createConfig } from '@internal/configs/base/tsdown'

export default createConfig({
	entry: {
		'*': './src/operations/*.ts',
		'emitter': './src/classes/emitter.ts',
		'index': './src/namespaces/index.ts',
	},
})
