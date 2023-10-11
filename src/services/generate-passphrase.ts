import {
	characters,
	charactersAndSpecialCharacters,
	charsWithNumbers,
	generationErrorMessages,
	maxLengthForChars,
	maxLengthForWords,
	minLengthForChars,
	minLengthForWords,
	specialsAndNums,
	validLanguages,
} from '../config'

import { IndexableInputValue, Language } from '../models'

const datasets: { [key in Language]: string[] } = {
	fi: [],
	en: [],
	se: [],
}

// dynamically import dataset based on language
export async function selectLanguage(lang: Language): Promise<string[]> {
	if (!validLanguages.includes(lang)) {
		throw new Error(`Supplied language is not valid. Valid languages are: ${validLanguages}`)
	}

	if (datasets[lang][0]) {
		console.log('Cache hit for lang:', lang)
		return datasets[lang]
	}

	switch (lang) {
		case 'en':
			datasets['en'] = (await import('../assets/en.json')).default as string[]
			return datasets['en']
		default:
			datasets['fi'] = (await import('../assets/fi.json')).default
			return datasets['fi']
	}
}

/**
 * Generates a passphrase/password based on supplied parametres
 */
export async function createPassphrase(
	language: Language,
	passLength: string,
	data: IndexableInputValue,
): Promise<string> {
	const dataset = await selectLanguage(language)
	const minLength = data.words.selected ? minLengthForWords : minLengthForChars
	const maxLength = data.words.selected ? maxLengthForWords : maxLengthForChars

	const len = validateStringToBeValidNumber(passLength, minLength, maxLength)

	return handleReturns(len, data, dataset)
}

function handleReturns(len: number, data: IndexableInputValue, dataset: string[]): string {
	const USER_SPECIALS = data.randomChars.value || ''
	const wordString = data.words.selected ? getWordsWithObject(len, dataset) : null

	let finalString: string

	if (wordString !== null) {
		finalString = handleWordsTrue(data, wordString, USER_SPECIALS)
	} else {
		finalString = handleRandomCharStrings(data, len)
	}

	if (data.uppercase.selected && !data.words.selected) {
		finalString = toUppercase(finalString).toString()
	}

	return finalString
}

function handleWordsTrue(data: IndexableInputValue, wordString: string[], USER_SPECIALS: string): string {
	if (data.randomChars.value != null) {
		return applyTransformationsToWords(data, wordString).join(USER_SPECIALS)
	}

	if (data.numbers.selected) {
		return randomNumberOnString(wordString).join('').toString()
	}

	if (data.uppercase.selected) {
		return capitalizeFirstLetter(wordString).join('')
	}

	return wordString.join('')
}

function applyTransformationsToWords(data: IndexableInputValue, wordString: string[]): string[] {
	if (data.numbers.selected) {
		if (data.uppercase.selected) {
			return randomNumberOnString(capitalizeFirstLetter(wordString))
		}
		return randomNumberOnString(wordString)
	}

	if (data.uppercase.selected) {
		return capitalizeFirstLetter(wordString)
	}

	return wordString
}

function handleRandomCharStrings(data: IndexableInputValue, len: number): string {
	if (data.randomChars.selected && data.numbers.selected) {
		return createFromString(specialsAndNums, len)
	}

	if (!data.numbers.selected && !data.randomChars.selected) {
		return createFromString(characters, len)
	}

	if (data.numbers.selected) {
		return createFromString(charsWithNumbers, len)
	}

	if (data.randomChars.selected) {
		return createFromString(charactersAndSpecialCharacters, len)
	}
	new Error(`Something went wrong with getting the parametres`)
	return ' '
}

/**
 * Creates a randomised string of chars from a input string
 * @param stringToUse string that contains all the chars to generate the random string from
 * @returns randomized string
 */
const createFromString = (stringToUse: string, len: number): string => {
	const numArr = generateRandomArray(len, 0, stringToUse.length - 1)
	const charArr = stringToUse.split('')

	const str: string[] = []
	numArr.forEach((_num, i) => {
		return str.push(charArr[numArr[i]])
	})

	return str.join('')
}

const validateStringToBeValidNumber = (stringToCheck: string, min: number, max: number): number => {
	const errors = generationErrorMessages(min, max)

	if (typeof stringToCheck !== 'string') {
		throw new Error(errors.notString)
	}

	if (stringToCheck == null) {
		// Since there is a default value, this will probably never be hit
		throw new Error(errors.nullOrUndefined)
	}

	if (isNaN(Number(stringToCheck))) {
		throw new Error(errors.notNumericString)
	}

	const strAsNumber = parseInt(stringToCheck, 10)

	if (strAsNumber < 1) {
		throw new Error(errors.smallerThanOne)
	}

	if (strAsNumber > max) {
		throw new Error(errors.tooLong)
	}

	if (strAsNumber < min) {
		throw new Error(errors.tooShort)
	}

	return Math.round(strAsNumber)
}

/**
 * converts strings to uppercase
 * @param stringToUpper either a string or string[]
 * @returns uppercased string or string[]
 */
const toUppercase = (stringToUpper: string[] | string): string | string[] => {
	const someCharToUpper = (someStr: string): string => {
		const len = someStr.length
		// so that there is always at least ONE char left lowercase (of course not possible if contains nums or specials...) we do "len - 1" for the arrays length
		const arr = generateRandomArray(len - 1, 0, len)

		const strArr = someStr.split('')
		arr.forEach((i) => {
			if (i < len) {
				strArr[i] = strArr[i].toUpperCase()
			}
		})
		return strArr.join('')
	}

	if (typeof stringToUpper === 'string') {
		return someCharToUpper(stringToUpper)
	}
	const strArr: string[] = []
	stringToUpper.map((str) => {
		return strArr.push(someCharToUpper(str))
	})
	return strArr
}

// Generate a random integer  with equal chance in  min <= r < max.     https://stackoverflow.com/questions/41437492/how-to-use-window-crypto-getrandomvalues-to-get-random-values-in-a-specific-rang
function generateRandomNumberInRange(min: number, max: number): number {
	const range = max - min

	if (max <= min) {
		throw new Error(`Max '${max}' must be larger than min: '${min}'`)
	}
	const requestBytes = Math.ceil(Math.log2(range) / 8)
	if (requestBytes === 0) {
		// No randomness required
		return 0
	}
	const maxNum = Math.pow(256, requestBytes)
	const arr = new Uint8Array(requestBytes)

	let val: number

	do {
		// Fill the typed array with cryptographically secure random values
		crypto.getRandomValues(arr)

		// Combine the array of random bytes into a single integer
		val = 0
		for (let i = 0; i < requestBytes; i++) {
			val = (val << 8) + arr[i]
		}
	} while (val >= maxNum - (maxNum % range))

	// Return a random number within the specified range
	return min + (val % range)
}

/**
 * generates an array of random numbers
 * @param {number} len how many numbers are in the array
 * @returns array of numbers
 */
function generateRandomArray(len: number, min: number, max: number): number[] {
	const arr = []
	for (let i = 0; i < len; i++) {
		const randomNumber = generateRandomNumberInRange(min, max)
		arr.push(...[randomNumber])
	}
	return arr
}

/**
 * capitalize any strings first letter
 * @param stringArrToConvert string[] to capitalize
 * @returns capitalised strings
 */
function capitalizeFirstLetter(stringArrToConvert: string[] | undefined): string[] {
	if (stringArrToConvert == null) {
		throw new Error(`Error capitalising string`)
	}
	const convertedArr = stringArrToConvert.map((sana) => {
		return sana.charAt(0).toUpperCase() + sana.slice(1)
	})
	return convertedArr
}

/**
 *
 * @param len length of the random number array that is passed in
 * @param stringDataset the words as an string[] that are used to create phrases
 * @returns array of randomly selected strings
 */
function getWordsWithObject(len: number, stringDataset: string[]): string[] {
	const maxCount = stringDataset.length - 1 // the max word count in [language].json

	const randomNumsArray = generateRandomArray(len, 0, maxCount)

	const sanaArray: string[] = []

	for (const num of randomNumsArray) {
		try {
			sanaArray.push(stringDataset[num])
		} catch (error) {
			// sometimes capitalizeFirstLetter function returns undefined, so catch that here.
			// Should really not propagate this far.
			console.error(error)
			throw new Error(`Error `)
		}
	}
	return sanaArray
}

/**
 * adds a random number at the end of an string
 * @param stringArr array of strings from which the string is selected
 * @returns string[]
 */
const randomNumberOnString = (stringArr: string[] | undefined): string[] => {
	if (stringArr == null) {
		throw new Error(`no array of strings generated`)
	}

	const indexToSelect = generateRandomNumberInRange(0, stringArr.length)
	const numToPadWith = generateRandomNumberInRange(0, 10).toString()

	const paddedWithNumber = stringArr[indexToSelect] + numToPadWith
	stringArr[indexToSelect] = paddedWithNumber
	return stringArr
}
