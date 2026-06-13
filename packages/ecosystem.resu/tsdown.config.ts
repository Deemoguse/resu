import { createConfig } from '@internal/configs/base/tsdown'

export default createConfig([
	{
		name: 'Namespaces',
		entry: {
			'index': './src/namespaces/index.ts',
			'emitter': './src/classes/emitter.ts',
		},
	},
	{
		name: 'Operations',
		entry: {
			'*': './src/operations/*.ts',
		},
	},
	{
		name: 'Utils',
		entry: {
			'*': './src/utils/*.ts',
		},
	}
])
