import { describe, expect, it } from 'vitest'
import { maxLengthForChars, minLengthForChars } from '../../config'
import { IndexableInputValue } from '../../models'
import { createPassphrase } from '../generate-passphrase'

type TestConfig = {
	word?: boolean
	randomCharactersInString?: boolean
	numbers?: boolean
	uppercaseCharacters?: boolean
	inputFieldValueFromUser?: string
}

const defaultConfig: TestConfig = {
	word: false,
	randomCharactersInString: false,
	numbers: false,
	uppercaseCharacters: false,
	inputFieldValueFromUser: '-',
}

const testData = (config: TestConfig = {}): IndexableInputValue => {
	const { word, randomCharactersInString, numbers, uppercaseCharacters, inputFieldValueFromUser } = {
		...defaultConfig,
		...config,
	} // Merge default values with provided ones
	return {
		words: {
			selected: word || false, //If this is false, it will return a random string of characters
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

describe('createPassphrase creates a random string with correct length', () => {
	it('should return a string with length 10', () => {
		expect(createPassphrase('10', testData())).toHaveLength(10)
		expect(createPassphrase('10', testData({ numbers: true }))).toHaveLength(10)
		expect(createPassphrase('10', testData({ randomCharactersInString: true }))).toHaveLength(10)
	})

	it('should return a string with length maxLengthForChars', () => {
		expect(createPassphrase(maxLengthForChars.toString(), testData())).toHaveLength(64)
	})

	it('should not return a string with weird values', () => {
		expect(() => createPassphrase('-1', testData())).toThrowError('Value must be a positive number larger than 0')
		expect(() => createPassphrase('huh', testData())).toThrowError('Value must be a numeric string')
		expect(() => createPassphrase('007A', testData())).toThrowError('Value must be a numeric string')

		expect(() => createPassphrase('1200', testData())).toThrowError(`Value must not exceed ${maxLengthForChars}`)

		expect(() => createPassphrase('3', testData())).toThrowError(`Value cannot be smaller than ${minLengthForChars}`)

		// @ts-expect-error testing non-string value
		expect(() => createPassphrase(NaN, testData())).toThrowError('Value must be a numeric string')
		// @ts-expect-error testing nullish values
		expect(() => createPassphrase(null, testData())).toThrowError('Length ¯cannot be undefined or null')
	})
})

describe('Generated string includes certain characters based on user input', () => {
	it('Should include only characters', () => {
		const regExp = /^[a-zäö]+$/

		expect('jlkaäödjfjlaf').toMatch(regExp)
		expect(regExp.test('12jkasfäööä34')).toStrictEqual(false)
		expect(regExp.test('12jkasfä€öö.ä34_*')).toStrictEqual(false)

		expect(createPassphrase('10', testData())).toMatch(regExp)
	})

	it('Should include at least one uppercase character', () => {
		const regExp = /[A-ZÄÖ]/

		expect('jlkaÄödJfjlaf').toMatch(regExp)
		expect(regExp.test('12jkasfäööä34')).toStrictEqual(false)
		expect(regExp.test('12jkasfä€öö.ä34_*')).toStrictEqual(false)

		expect(createPassphrase('10', testData({ uppercaseCharacters: true }))).toMatch(regExp)
		expect(createPassphrase('3', testData({ word: true, uppercaseCharacters: true }))).toMatch(regExp)
	})

	it('Should include atleast one number', () => {
		const regExp = /\d/

		expect('jlkaäödjf53jlaf1').toMatch(regExp)
		expect(regExp.test('tämäontesti')).toStrictEqual(false)
		expect(regExp.test('tämä*ontes-ti')).toStrictEqual(false)

		expect(createPassphrase('30', testData({ numbers: true }))).toMatch(regExp)
		expect(createPassphrase('4', testData({ word: true, numbers: true }))).toMatch(regExp)
	})

	it('Should include specials', () => {
		const regExp = /[><,.\-_*?+\/()@%&!$€=#]/

		expect('jlk<aä.ödj-fjlaf').toMatch(regExp)
		expect('jlkaä$ödjfjlaf').toMatch(regExp)
		expect(regExp.test('thisisates2tstri4ng')).toStrictEqual(false)
		expect(regExp.test('tämäontesti')).toStrictEqual(false)

		expect(createPassphrase('30', testData({ randomCharactersInString: true }))).toMatch(regExp)
	})

	it('Should include numbers and specials', () => {
		const regExp = /^(?=.*[0-9])(?=.*[><,.\-_*?+\/()@%&!$€=#]).*$/

		expect('j9l0k<a5ä.ö1dj-fj6laf').toMatch(regExp)
		expect('j2lkaä€ödjfjlaf').toMatch(regExp)
		expect(regExp.test('thisisates2tstri4ng')).toStrictEqual(false)
		expect(regExp.test('tämäontesti')).toStrictEqual(false)
		expect(regExp.test('tämäon_testi')).toStrictEqual(false)

		// Characters
		expect(createPassphrase('30', testData({ randomCharactersInString: true, numbers: true }))).toMatch(regExp)

		// Words
		expect(createPassphrase('5', testData({ word: true, randomCharactersInString: true, numbers: true }))).toMatch(
			regExp,
		)
	})
})

/**
 * We already check for inclusion of special characters and numbers in the previous tests
 * So only check for other passphrase related properties, like
 * - amount of words
 * - amount of special characters
 */
describe('Generated passphrase is valid', () => {
	it('Should have correct amount of words', () => {
		const splitter = '-'
		const passphrase = createPassphrase(
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

	it('Should have correct amount of splitter characters', () => {
		const splitter = '?'
		const regExp = /[?]/g
		const passphrase = createPassphrase(
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
