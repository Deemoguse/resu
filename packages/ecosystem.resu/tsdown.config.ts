import { createConfig } from '@internal/configs/base/tsdown'

export default createConfig({
	entry: {
		'index': './src/namespaces/index.ts',

		'*': './src/operations/*.ts',
		'utils/*': './src/utils/*.ts',
		'emitter': './src/classes/emitter.ts',
		'types': './src/types.ts',
	},
})
