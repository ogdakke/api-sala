import { IndexableInputValue } from '../models'

export const defaultResponse: IndexableInputValue = {
	words: {
		value: undefined,
		selected: true,
	},
	uppercase: {
		value: undefined,
		selected: true,
	},
	titlecase: {
		value: undefined,
		selected: false,
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
export const maxLengthForChars = 64
export const maxLengthForWords = 12

export const specialsAndNums = 'abcdefghijklmnopqrstuyäöxz1234567890><,.-_*?+/()@%&!$€=#'
export const charactersAndSpecialCharacters = 'abcdefghijklmnopqrstuyäöxz><,.-_*?+/()@%&!$€=#'
export const charsWithNumbers = 'abcdefghijklmnopqrstuyäöxz1234567890'
export const characters = 'abcdefghijklmnopqrstuyäöxz'
export const specials = '><,.-_*?+/()@%&!$€=#'
