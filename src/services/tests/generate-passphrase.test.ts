import { describe, expect, it } from 'vitest'
import {
	generationErrorMessages,
	maxLengthForChars,
	maxLengthForWords,
	minLengthForChars,
	minLengthForWords,
} from '../../config'
import { IndexableInputValue, Language } from '../../models'
import { createPassphrase } from '../generate-passphrase'

type TestConfig = {
	language?: Language
	word?: boolean
	randomCharactersInString?: boolean
	numbers?: boolean
	uppercaseCharacters?: boolean
	inputFieldValueFromUser?: string
}

const defaultConfig: TestConfig = {
	language: 'fi',
	word: false,
	randomCharactersInString: false,
	numbers: false,
	uppercaseCharacters: false,
	inputFieldValueFromUser: '-',
}

let variableMinLength = minLengthForChars
let variableMaxLength = maxLengthForChars
const testData = (config: TestConfig = {}): IndexableInputValue => {
	const { language, word, randomCharactersInString, numbers, uppercaseCharacters, inputFieldValueFromUser } = {
		...defaultConfig,
		...config,
	} // Merge default values with provided ones

	variableMinLength = !!word ? minLengthForWords : minLengthForChars
	variableMaxLength = !!word ? maxLengthForWords : maxLengthForChars
	return {
		language: language || 'fi',
		words: {
			selected: !!word || false, //If this is false, it will return a random string of characters
			value: '',
		},
		randomChars: {
			selected: randomCharactersInString || false,
			value: inputFieldValueFromUser, //this only should apply if word === true
		},
		uppercase: {
			selected: uppercaseCharacters || false,
			value: '',
		},
		numbers: {
			selected: numbers || false,
			value: '',
		},
	}
}
const testLang = testData().language
const errors = generationErrorMessages(variableMinLength, variableMaxLength)
describe('createPassphrase() creates a random string with correct length', () => {
	it('should return a string with length 10', async () => {
		expect(await createPassphrase(testLang, '10', testData())).toHaveLength(10)
		expect(await createPassphrase(testLang, '10', testData({ numbers: true }))).toHaveLength(10)
		expect(await createPassphrase(testLang, '10', testData({ randomCharactersInString: true }))).toHaveLength(10)
	})

	it('should return a string with length maxLengthForChars', async () => {
		expect(await createPassphrase(testLang, maxLengthForChars.toString(), testData())).toHaveLength(maxLengthForChars)
	})

	it('should throw errors on a string with weird values', async () => {
		expect(await createPassphrase(testLang, 'huh', testData())).toThrowError(errors.notNumericString)
		expect(async () => await createPassphrase(testLang, '007A', testData())).toThrowError(errors.notNumericString)
		expect(async () => await createPassphrase(testLang, '10.5', testData())).toThrowError(errors.notNumericString)

		expect(async () => await createPassphrase(testLang, '-1', testData())).toThrowError(errors.smallerThanOne)
		expect(async () => await createPassphrase(testLang, '1200', testData())).toThrowError(errors.tooLong)

		expect(async () => await createPassphrase(testLang, '3', testData())).toThrowError(errors.tooShort)

		// @ts-expect-error testing non-string value
		expect(async () => await createPassphrase(testLang, NaN, testData())).toThrowError(errors.notNumericString)
		// @ts-expect-error testing nullish values
		expect(async () => await createPassphrase(testLang, null, testData())).toThrowError(errors.nullOrUndefined)
	})
})

describe('Generated string includes certain characters based on user input', () => {
	it('Should include only characters', async () => {
		const regExp = /^[a-zäö]+$/

		expect('jlkaäödjfjlaf').toMatch(regExp)
		expect(regExp.test('12jkasfäööä34')).toStrictEqual(false)
		expect(regExp.test('12jkasfä€öö.ä34_*')).toStrictEqual(false)

		expect(await createPassphrase(testLang, '10', testData())).toMatch(regExp)
	})

	it('Should include at least one uppercase character', async () => {
		const regExp = /[A-ZÄÖ]/

		expect('jlkaÄödJfjlaf').toMatch(regExp)
		expect(regExp.test('12jkasfäööä34')).toStrictEqual(false)
		expect(regExp.test('12jkasfä€öö.ä34_*')).toStrictEqual(false)

		expect(await createPassphrase(testLang, '10', testData({ uppercaseCharacters: true }))).toMatch(regExp)
		expect(await createPassphrase(testLang, '3', testData({ word: true, uppercaseCharacters: true }))).toMatch(regExp)
	})

	it('Should include atleast one number', async () => {
		const regExp = /\d/

		expect('jlkaäödjf53jlaf1').toMatch(regExp)
		expect(regExp.test('tämäontesti')).toStrictEqual(false)
		expect(regExp.test('tämä*ontes-ti')).toStrictEqual(false)

		expect(await createPassphrase(testLang, '30', testData({ numbers: true }))).toMatch(regExp)
		expect(await createPassphrase(testLang, '4', testData({ word: true, numbers: true }))).toMatch(regExp)
	})

	it('Should include specials', async () => {
		const regExp = /[><,.\-_*?+\/()@%&!$€=#]/

		expect('jlk<aä.ödj-fjlaf').toMatch(regExp)
		expect('jlkaä$ödjfjlaf').toMatch(regExp)
		expect(regExp.test('thisisates2tstri4ng')).toStrictEqual(false)
		expect(regExp.test('tämäontesti')).toStrictEqual(false)

		expect(await createPassphrase(testLang, '30', testData({ randomCharactersInString: true }))).toMatch(regExp)
	})

	it('Should include numbers and specials', async () => {
		const regExp = /^(?=.*[0-9])(?=.*[><,.\-_*?+\/()@%&!$€=#]).*$/

		expect('j9l0k<a5ä.ö1dj-fj6laf').toMatch(regExp)
		expect('j2lkaä€ödjfjlaf').toMatch(regExp)
		expect(regExp.test('thisisates2tstri4ng')).toStrictEqual(false)
		expect(regExp.test('tämäontesti')).toStrictEqual(false)
		expect(regExp.test('tämäon_testi')).toStrictEqual(false)

		// Characters
		expect(await createPassphrase(testLang, '30', testData({ randomCharactersInString: true, numbers: true }))).toMatch(
			regExp,
		)

		// Words
		expect(
			await createPassphrase(testLang, '5', testData({ word: true, randomCharactersInString: true, numbers: true })),
		).toMatch(regExp)
	})
})

/**
 * We already check for inclusion of special characters and numbers in the previous tests
 * So only check for other passphrase related properties, like
 * - amount of words
 * - amount of special characters
 */
describe('Generated passphrase is valid', () => {
	it('Should have correct amount of words', async () => {
		const splitter = '-'
		const passphrase = await createPassphrase(
			testLang,
			'2',
			testData({
				word: true,
				inputFieldValueFromUser: splitter,
			}),
		)
		expect(passphrase).toContain(splitter)

		const splitStringArr = passphrase.split(splitter)
		expect(splitStringArr).toHaveLength(2)
	})

	it('Should have correct amount of splitter characters', async () => {
		const splitter = '?'
		const regExp = /[?]/g
		const passphrase = await createPassphrase(
			testLang,
			'3',
			testData({
				word: true,
				inputFieldValueFromUser: splitter,
			}),
		)
		expect(passphrase).toContain(splitter)

		const splitterArr = passphrase.match(regExp)
		expect(splitterArr).toStrictEqual(['?', '?'])
	})
})
