import { IndexableInputValue, Language } from '../models'

export function getConfig(language?: Language) {
	const config = {
		// Length restrictions
		minLengthForChars: 4,
		minLengthForWords: 1,
		maxLengthForChars: 128,
		maxLengthForWords: 28,
		// Strings to generate from
		generationStrings: getGenerationStrings(language),
	}

	return config
}

export const validLanguages: Language[] = ['fi', 'en']
export const defaultLengthOfPassphrase = '3'

export const defaultResponse: IndexableInputValue = {
	language: 'fi',
	words: {
		selected: true,
	},
	uppercase: {
		selected: true,
	},
	numbers: {
		selected: true,
	},
	randomChars: {
		value: '-',
		selected: true,
	},
}

const characters = {
	fi: 'abcdefghijklmnopqrstuyäöxz',
	en: 'abcdefghijklmnopqrstuyxz',
}
const numbers = '0123456789'
const specials = '><,.-_*?+()@%&!$€=#'

function getChars(Language?: Language) {
	switch (Language) {
		case 'en':
			return characters.en
		default:
			return characters.fi
	}
}

function getGenerationStrings(language?: Language) {
	const characters = getChars(language)

	return {
		numbers: numbers,
		characters: characters,
		specials: specials,
		specialsAndNums: `${characters}${numbers}${specials}`,
		charactersAndSpecialCharacters: `${characters}${specials}`,
		charsWithNumbers: `${characters}${numbers}`,
	}
}

export const validationErrorMessages = (min: number, max: number) => {
	const validationErrors = {
		notStringOrNumber: 'Type of length must be number or string',
		nullOrUndefined: 'Length cannot be undefined or null',
		notNumericStringOrNumber: 'Length must be a number, or a string containing a numeric integer',
		smallerThanOne: 'Length must be a positive number larger than 0',
		tooLong: `Length must not exceed ${max}`,
		tooShort: `Length cannot be smaller than ${min}`,
	}
	return validationErrors
}

export const generationErrors = {
	noStringArrayFound: 'No string[] found to capitalize',
	noStringArrayForAddingNumber: 'No string[] supplied to add number to',
	noParametresFound: 'Something went wrong with getting the parametres',
}
