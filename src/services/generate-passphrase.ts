import {
	characters,
	charactersAndSpecialCharacters,
	charsWithNumbers,
	defaultLengthOfPassphrase,
	defaultResponse,
	maxLengthForChars,
	maxLengthForWords,
	minLengthForChars,
	minLengthForWords,
	specialsAndNums,
} from '../config'

import { IndexableInputValue } from '../models'

const sanat = await import('../assets/sanat.json')

let variableMinLength = minLengthForWords
let variableMaxLength = maxLengthForChars

export function createPassphrase(passLength = defaultLengthOfPassphrase, data = defaultResponse): string {
	variableMinLength = data.words.selected ? minLengthForWords : minLengthForChars
	variableMaxLength = data.words.selected ? maxLengthForWords : maxLengthForChars

	const length = validateStringToBeNumber(passLength)

	return handleReturns(length, data)
}

function handleReturns(length: number, data: IndexableInputValue): string {
	const USER_SPECIALS = data.randomChars.value || ''
	const wordString = data.words.selected ? getWordsWithObject(length, sanat.default) : null

	let finalString: string

	if (wordString !== null) {
		finalString = handleWordsTrue(data, wordString, USER_SPECIALS)
	} else {
		finalString = handleWordsFalse(data, length)
	}

	if (data.uppercase.selected && !data.words.selected) {
		finalString = toUppercase(finalString).toString()
	}

	return finalString
}

function handleWordsTrue(data: IndexableInputValue, wordString: string[], USER_SPECIALS: string): string {
	if (data.randomChars.value != null) {
		const joinedWordString = applyTransformationsToWords(data, wordString).join(USER_SPECIALS)
		return joinedWordString
	}

	if (data.numbers.selected) {
		const numberedArr = randomNumberOnString(wordString)
		return numberedArr.join('').toString()
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

function handleWordsFalse(data: IndexableInputValue, length: number): string {
	if (data.randomChars.selected && data.numbers.selected) {
		return createFromString(specialsAndNums, length)
	}

	if (!data.numbers.selected && !data.randomChars.selected) {
		return createFromString(characters, length)
	}

	if (data.numbers.selected) {
		return createFromString(charsWithNumbers, length)
	}

	if (data.randomChars.selected) {
		return createFromString(charactersAndSpecialCharacters, length)
	}

	return ' '
}

/**
 * Creates a randomised string of chars from a input string
 * @param stringToUse string that contains all the chars to generate the random string from
 * @returns randomized string
 */
const createFromString = (stringToUse: string, length: number): string => {
	const numArr = generateRandomArray(length, 0, stringToUse.length - 1)
	const charArr = stringToUse.split('')

	const str: string[] = []
	numArr.map((_num, i) => {
		return str.push(charArr[numArr[i]])
	})

	return str.join('')
}

const validateStringToBeNumber = (stringToCheck: string) => {
	if (stringToCheck == null) {
		// Since there is a default value, this will probably never be hit
		throw new Error('Length cannot be undefined or null')
	}

	if (isNaN(Number(stringToCheck))) {
		throw new Error('Value must be a numeric string')
	}

	const strAsNumber = parseInt(stringToCheck)

	if (strAsNumber < 1) {
		throw new Error('Value must be a positive number larger than 0')
	}

	if (strAsNumber > variableMaxLength) {
		throw new Error(`Value must not exceed ${variableMaxLength}`)
	}

	if (strAsNumber < variableMinLength) {
		throw new Error(`Value cannot be smaller than ${variableMinLength}`)
	}

	return strAsNumber
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
		// return stringToUpper.toUpperCase()
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
		throw new Error('Max must be larger than min')
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
 * generates a array of random number
 * @param {number} length how many numbers are in the array
 * @returns array of numbers
 */
function generateRandomArray(length: number, min: number, max: number): number[] {
	const arr = []
	for (let i = 0; i < length; i++) {
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
function capitalizeFirstLetter(stringArrToConvert: string[]): string[] {
	if (stringArrToConvert === undefined) {
		throw new Error('Virhe')
	}
	const convertedArr = stringArrToConvert.map((sana) => {
		return sana.charAt(0).toUpperCase() + sana.slice(1)
	})
	return convertedArr
}

/**
 *
 * @param length length of the random number array that is passed in
 * @param objektiSanat the words as a array that are used to create phrases
 * @returns array of strings
 */
function getWordsWithObject(length: number, objektiSanat: string[]): string[] {
	// console.time("length")
	const maxCount = objektiSanat.length - 1 // the max word count in sanat.json

	// const then = performance.now()
	const randomNumsArray = generateRandomArray(length, 0, maxCount)

	const sanaArray: string[] = []

	for (const num of randomNumsArray) {
		try {
			sanaArray.push(objektiSanat[num])
		} catch (error) {
			// sometimes it returned undefined from the capitalizeFirstLetter function, so catch that here.
			console.error(error)
		}
	}
	// console.timeEnd("length")
	return sanaArray
}

/**
 * adds a random number at the end of an string
 * @param stringArr array of strings from which the string is selected
 * @returns string[]
 */
const randomNumberOnString = (stringArr: string[]): string[] => {
	const indexToSelect = generateRandomNumberInRange(0, stringArr.length)
	const numToPadWith = generateRandomNumberInRange(0, 10).toString()

	const paddedWithNumber = stringArr[indexToSelect] + numToPadWith
	stringArr[indexToSelect] = paddedWithNumber
	return stringArr
}
