export function isKey<T extends object>(x: T, k: PropertyKey): k is keyof T {
	return k in x
}

export function isIncludedInArray({ value, arr }: { value: any; arr: Array<any> }): boolean {
	if (!value || !arr) {
		console.error({
			message: 'No value or array passed',
			params: {
				value: value,
				array: arr,
			},
		})

		throw new Error('No value or array passed to check')
	}
	return arr.includes(value)
}
