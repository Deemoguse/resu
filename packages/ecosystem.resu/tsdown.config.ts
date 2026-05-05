import { createConfig } from '@internal/configs/base/tsdown'

export default createConfig({
	entry: {
		index: './src/index.namespaces.ts',
		barrel: './src/index.barrel.ts'
	}
})
