import { createConfig } from '@internal/configs/base/tsdown'

export default createConfig({
	entry: {
		'*': './src/operations/*.ts',
		'utils/*': './src/utils/*.ts',

		'index': './src/namespaces/index.ts',
		'emitter': './src/classes/emitter.ts',
	},
})
