import { generationErrors, getConfig, validationErrorMessages } from '../config'
import { IndexableInputValue, PassLength } from '../models'

/**
 * Generates a passphrase/password based on supplied parametres
 */
export async function createPassphrase({
	dataset,
	passLength,
	inputs,
}: {
	dataset: string[]
	passLength: PassLength
	inputs: IndexableInputValue
}): Promise<string> {
	const { minLengthForChars, maxLengthForChars, minLengthForWords, maxLengthForWords } = getConfig(inputs.language)
	const minLength = inputs.words.selected ? minLengthForWords : minLengthForChars
	const maxLength = inputs.words.selected ? maxLengthForWords : maxLengthForChars

	const len = validateStringToBeValidNumber({ passLength, min: minLength, max: maxLength })

	return handleReturns({ len, inputs, dataset })
}

function handleReturns({
	len,
	inputs,
	dataset,
}: {
	len: number
	inputs: IndexableInputValue
	dataset: string[]
}): string {
	const { randomChars, words, uppercase } = inputs
	const USER_SPECIALS = randomChars.value || ''

	const getFinalString = (wordString: string[] | null): string => {
		if (wordString !== null) {
			return handleWordsTrue({ inputs, wordString, USER_SPECIALS })
		}

		return handleRandomCharStrings({ inputs, len })
	}

	const applyUpperCase = (str: string): string => {
		const shouldBeUppercase = uppercase.selected
		const isNotWordString = !words.selected

		if (shouldBeUppercase && isNotWordString) {
			return toUppercase(str).toString()
		}

		return str
	}

	const wordString = words.selected ? getRandomWordsFromDataset(len, dataset) : null

	const finalString = getFinalString(wordString)

	return applyUpperCase(finalString)
}

function handleWordsTrue({
	inputs,
	wordString,
	USER_SPECIALS,
}: {
	inputs: IndexableInputValue
	wordString: string[]
	USER_SPECIALS: string
}): string {
	if (inputs.randomChars.value != null) {
		return applyTransformationsToWords(inputs, wordString).join(USER_SPECIALS)
	}

	if (inputs.numbers.selected) {
		return addRandomNumberToString(wordString).join('').toString()
	}

	if (inputs.uppercase.selected) {
		return capitalizeFirstLetter(wordString).join('')
	}

	return wordString.join('')
}

function applyTransformationsToWords(inputs: IndexableInputValue, wordString: string[]): string[] {
	if (inputs.numbers.selected) {
		if (inputs.uppercase.selected) {
			return addRandomNumberToString(capitalizeFirstLetter(wordString))
		}
		return addRandomNumberToString(wordString)
	}

	if (inputs.uppercase.selected) {
		return capitalizeFirstLetter(wordString)
	}

	return wordString
}

function handleRandomCharStrings({ inputs, len }: { inputs: IndexableInputValue; len: number }): string {
	const {
		generationStrings: { specialsAndNums, characters, charsWithNumbers, charactersAndSpecialCharacters },
	} = getConfig(inputs.language)

	if (inputs.randomChars.selected && inputs.numbers.selected) {
		return createFromString(specialsAndNums, len)
	}

	if (!inputs.numbers.selected && !inputs.randomChars.selected) {
		return createFromString(characters, len)
	}

	if (inputs.numbers.selected) {
		return createFromString(charsWithNumbers, len)
	}

	if (inputs.randomChars.selected) {
		return createFromString(charactersAndSpecialCharacters, len)
	}
	throw new Error(generationErrors.noParametresFound)
}

/**
 * Creates a randomised string of characters from an input string
 */
const createFromString = (stringToUse: string, len: number): string => {
	const numArr = generateRandomArray({ len, min: 0, max: stringToUse.length - 1 })
	const charArr = stringToUse.split('')

	const stringArr: string[] = []
	numArr.forEach((_num, i) => {
		return stringArr.push(charArr[numArr[i]])
	})

	return stringArr.join('')
}

const validateStringToBeValidNumber = ({
	passLength,
	min,
	max,
}: {
	passLength: PassLength
	min: number
	max: number
}): number => {
	const errors = validationErrorMessages(min, max)

	if (typeof passLength !== 'string' && typeof passLength !== 'number') {
		throw new Error(errors.notStringOrNumber)
	}

	if (passLength == null) {
		// Since there is a default value, this will probably never be hit
		throw new Error(errors.nullOrUndefined)
	}

	if (Number.isNaN(passLength)) {
		throw new Error(errors.notNumericStringOrNumber)
	}
	const strAsNumber = typeof passLength === 'string' ? parseInt(passLength, 10) : passLength

	if (isNaN(strAsNumber)) {
		throw new Error(errors.notNumericStringOrNumber)
	}

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
 * converts a single character from either a string or an array of strings to uppercase
 */
const toUppercase = (stringToUpper: string[] | string): string | string[] => {
	const someCharToUpper = (someStr: string): string => {
		const len = someStr.length
		// so that there is always at least ONE char left lowercase
		// (of course not possible if contains nums or specials...) we do "len - 1" for the arrays length
		const arr = generateRandomArray({ len: len - 1, min: 0, max: len })

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
	stringToUpper.map((stringArr) => {
		return strArr.push(someCharToUpper(stringArr))
	})

	return strArr
}

const isNumberRangeValid = ({ min, max }: { min: number; max: number }) => min < max

const calculateRequestBytes = (range: number): number => {
	return Math.ceil(Math.log2(range) / 8)
}

function generateRandomValueFromBytes(requestBytes: number): number {
	const maxNum = Math.pow(256, requestBytes)
	const arr = new Uint8Array(requestBytes)
	let val = 0

	do {
		crypto.getRandomValues(arr)
		val = 0

		for (let i = 0; i < requestBytes; i++) {
			val = (val << 8) + arr[i]
		}
	} while (val >= maxNum - (maxNum % requestBytes))

	return val
}

// Generate a random integer  with equal chance in min <= r < max. courtesy of https://stackoverflow.com/questions/41437492/how-to-use-window-crypto-getrandomvalues-to-get-random-values-in-a-specific-rang
function generateRandomNumberInRange({ min, max }: { min: number; max: number }): number {
	if (!isNumberRangeValid({ min, max })) {
		throw new Error(`Max '${max}' must be larger than min: '${min}'`)
	}

	const range = max - min
	const requestBytes = calculateRequestBytes(range)

	if (requestBytes === 0) {
		return 0
	}

	const randomValue = generateRandomValueFromBytes(requestBytes)

	return min + (randomValue % range)
}

/**
 * generates an array of random numbers between min and max, with length 'len'
 */
function generateRandomArray({ len, min, max }: { len: number; min: number; max: number }): number[] {
	const arr = []
	for (let i = 0; i < len; i++) {
		arr.push(...[generateRandomNumberInRange({ min, max })])
	}
	return arr
}

/**
 * from an string[], capitalize any strings first letter
 */
function capitalizeFirstLetter(stringArrToConvert: string[] | undefined): string[] {
	if (stringArrToConvert == null) {
		throw new Error(`Error capitalising string`)
	}
	const convertedArr = stringArrToConvert.map((word) => {
		return word.charAt(0).toUpperCase() + word.slice(1)
	})
	return convertedArr
}

/**
 * generates an array of length `length` from randomly selected strings in stringDataset
 */
function getRandomWordsFromDataset(length: number, stringDataset: string[]): string[] {
	const maxCount = stringDataset.length - 1 // the max word count in [language].json

	const randomNumsArray = generateRandomArray({ len: length, min: 0, max: maxCount })

	const sanaArray: string[] = []

	for (const num of randomNumsArray) {
		try {
			sanaArray.push(stringDataset[num])
		} catch (error) {
			// sometimes capitalizeFirstLetter function returns undefined, so catch that here.
			// Should really not propagate this far.
			throw new Error('Error pushing dataset values')
		}
	}
	return sanaArray
}

/**
 * adds a random number at the end of some string in an array
 */
const addRandomNumberToString = (stringArr: string[] | undefined): string[] => {
	if (stringArr == null) {
		throw new Error(generationErrors.noStringArrayForAddingNumber)
	}

	const indexToSelect = generateRandomNumberInRange({ min: 0, max: stringArr.length })
	const numToPadWith = generateRandomNumberInRange({ min: 0, max: 10 }).toString()

	const updatedArray = stringArr.map((str, i) => {
		if (i === indexToSelect) {
			return str + numToPadWith
		}
		return str
	})

	return updatedArray
}
