export default {
	'*.{ts,js}': [
		() => 'npm run lint-fix',
		() => 'npm run test',
	]
}
