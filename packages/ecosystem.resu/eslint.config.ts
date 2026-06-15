import { createConfig } from '@internal/configs/base/eslint'
import eslintInferizationType from '@internal/inferization-type-eslint'

export default createConfig([
	eslintInferizationType.configs.recommendedTypeChecked,
	{
		rules: {
			'@typescript-eslint/unified-signatures': 'off'
		}
	}
])
