import { IndexableInputValue } from '../models'

export const validLanguages = ['fi', 'en']
export const defaultLengthOfPassphrase = '3'
export const defaultResponse: IndexableInputValue = {
	language: 'fi',
	words: {
		value: undefined,
		selected: true,
	},
	uppercase: {
		value: undefined,
		selected: true,
	},
	numbers: {
		value: undefined,
		selected: true,
	},
	randomChars: {
		value: '-',
		selected: true,
	},
}

export const minLengthForChars = 4
export const minLengthForWords = 1
export const maxLengthForChars = 128
export const maxLengthForWords = 28

export const specialsAndNums = 'abcdefghijklmnopqrstuyäöxz1234567890><,.-_*?+()@%&!$€=#'
export const charactersAndSpecialCharacters = 'abcdefghijklmnopqrstuyäöxz><,.-_*?+()@%&!$€=#'
export const charsWithNumbers = 'abcdefghijklmnopqrstuyäöxz1234567890'
export const characters = 'abcdefghijklmnopqrstuyäöxz'
export const specials = '><,.-_*?+()@%&!$€=#'

export const generationErrorMessages = (min: number, max: number) => {
	const labels = {
		notStringOrNumber: 'Type of length must be number or string',
		nullOrUndefined: 'Length cannot be undefined or null',
		notNumericStringOrNumber: 'Length must be a number, or a string containing a numeric integer',
		smallerThanOne: 'Length must be a positive number larger than 0',
		tooLong: `Length must not exceed ${max}`,
		tooShort: `Length cannot be smaller than ${min}`,
	}
	return labels
}
