import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'node',
		include: ['test/runtime/**/*.test.ts'],
		setupFiles: ['test/runtime/setup.ts'],
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
			reporter: ['text', 'html', 'json-summary'],
			reportOnFailure: true,
			thresholds: {
				lines: 100,
				functions: 100,
				statements: 99,
				branches: 98,
			},
		},
	},
})
