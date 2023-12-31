import { describe, expect, it } from 'vitest'
import { getConfig, validationErrorMessages } from '../../config'
import { IndexableInputValue, Language } from '../../models'
import { createPassphrase } from '../generate-passphrase'
const dataset = (await import('../../../assets/fi.json')).default

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
const config = getConfig(defaultConfig.language)
const { minLengthForChars, maxLengthForChars, minLengthForWords, maxLengthForWords } = config
let variableMinLength = minLengthForChars
let variableMaxLength = maxLengthForChars
const testData = (testConfig: TestConfig = {}): IndexableInputValue => {
	const { language, word, randomCharactersInString, numbers, uppercaseCharacters, inputFieldValueFromUser } = {
		...defaultConfig,
		...testConfig,
	} // Merge default values with provided ones

	variableMinLength = word ? minLengthForWords : minLengthForChars
	variableMaxLength = word ? maxLengthForWords : maxLengthForChars
	return {
		language: language || 'fi',
		words: {
			selected: word || false, // If this is false, it will return a random string of characters
			value: '',
		},
		randomChars: {
			selected: randomCharactersInString || false,
			value: inputFieldValueFromUser, // this only should apply if word === true
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

const errors = validationErrorMessages(variableMinLength, variableMaxLength)
describe('createPassphrase() creates a random string with correct length', () => {
	it('should return a string with correct length', async () => {
		expect(await createPassphrase({ dataset, passLength: 10, inputs: testData() })).toHaveLength(10)
		expect(await createPassphrase({ dataset, passLength: '10', inputs: testData({ numbers: true }) })).toHaveLength(10)
		expect(
			await createPassphrase({ dataset, passLength: '10', inputs: testData({ randomCharactersInString: true }) }),
		).toHaveLength(10)

		/**weird values, but they are number */
		expect(await createPassphrase({ dataset, passLength: '007A', inputs: testData() })).toHaveLength(7)
		expect(
			await createPassphrase({
				dataset,
				passLength: '012whaaat??? its not weird at all that this is valid',
				inputs: testData({ numbers: true }),
			}),
		).toHaveLength(12)
		expect(await createPassphrase({ dataset, passLength: '10.5', inputs: testData() })).toHaveLength(10)
	})

	it('should return a random string even if no dataset supplied', async () => {
		expect(await createPassphrase({ passLength: 32, inputs: testData({}) })).toHaveLength(32)
	})

	it('should reject invalid values even if no dataset supplied', async () => {
		await expect(
			async () => await createPassphrase({ passLength: 400, inputs: testData({ word: false }) }),
		).rejects.toThrow(errors.tooLong)

		await expect(async () => await createPassphrase({ passLength: 'huh?', inputs: testData({}) })).rejects.toThrowError(
			errors.notNumericStringOrNumber,
		)
	})

	it('should return a string with length maxLengthForChars', async () => {
		expect(await createPassphrase({ dataset, passLength: maxLengthForChars, inputs: testData({}) })).toHaveLength(
			maxLengthForChars,
		)
	})

	it('should throw errors on a string with weird values', async () => {
		/** Testing parsing of strings */
		await expect(
			async () => await createPassphrase({ dataset, passLength: 'huh?', inputs: testData({}) }),
		).rejects.toThrowError(errors.notNumericStringOrNumber)

		await expect(
			async () => await createPassphrase({ dataset, passLength: '-1', inputs: testData({}) }),
		).rejects.toThrowError(errors.smallerThanOne)
		await expect(
			async () => await createPassphrase({ dataset, passLength: '1200', inputs: testData({}) }),
		).rejects.toThrowError(errors.tooLong)

		await expect(
			async () => await createPassphrase({ dataset, passLength: '3', inputs: testData({}) }),
		).rejects.toThrowError(errors.tooShort)

		/** Testing Numbers */
		await expect(
			async () => await createPassphrase({ dataset, passLength: -1, inputs: testData({}) }),
		).rejects.toThrowError(errors.smallerThanOne)
		await expect(
			async () => await createPassphrase({ dataset, passLength: Infinity, inputs: testData({}) }),
		).rejects.toThrowError(errors.tooLong)
		await expect(
			async () => await createPassphrase({ dataset, passLength: NaN, inputs: testData({}) }),
		).rejects.toThrowError(errors.notNumericStringOrNumber)
	})
})

describe('Generated string includes certain characters based on user input', () => {
	it('Should include only characters', async () => {
		const regExp = /^[a-zäö]+$/

		expect('jlkaäödjfjlaf').toMatch(regExp)
		expect(regExp.test('12jkasfäööä34')).toStrictEqual(false)
		expect(regExp.test('12jkasfä€öö.ä34_*')).toStrictEqual(false)

		expect(await createPassphrase({ dataset, passLength: '10', inputs: testData({}) })).toMatch(regExp)
	})

	it('Should include at least one uppercase character', async () => {
		const regExp = /[A-ZÄÖ]/

		expect('jlkaÄödJfjlaf').toMatch(regExp)
		expect(regExp.test('12jkasfäööä34')).toStrictEqual(false)
		expect(regExp.test('12jkasfä€öö.ä34_*')).toStrictEqual(false)

		expect(
			await createPassphrase({ dataset, passLength: '10', inputs: testData({ uppercaseCharacters: true }) }),
		).toMatch(regExp)
		expect(
			await createPassphrase({ dataset, passLength: '10', inputs: testData({ uppercaseCharacters: true }) }),
		).toMatch(regExp)
	})

	it('Should include atleast one number', async () => {
		const regExp = /\d/

		expect('jlkaäödjf53jlaf1').toMatch(regExp)
		expect(regExp.test('tämäontesti')).toStrictEqual(false)
		expect(regExp.test('tämä*ontes-ti')).toStrictEqual(false)

		expect(await createPassphrase({ dataset, passLength: '30', inputs: testData({ numbers: true }) })).toMatch(regExp)
		expect(
			await createPassphrase({ dataset, passLength: '4', inputs: testData({ word: true, numbers: true }) }),
		).toMatch(regExp)
	})

	it('Should include specials', async () => {
		const regExp = /[><,.\-_*?+\/()@%&!$€=#]/

		expect('jlk<aä.ödj-fjlaf').toMatch(regExp)
		expect('jlkaä$ödjfjlaf').toMatch(regExp)
		expect(regExp.test('thisisates2tstri4ng')).toStrictEqual(false)
		expect(regExp.test('tämäontesti')).toStrictEqual(false)

		expect(
			await createPassphrase({ dataset, passLength: '30', inputs: testData({ randomCharactersInString: true }) }),
		).toMatch(regExp)
	})

	it('Should include numbers and specials', async () => {
		const regExp = /^(?=.*[0-9])(?=.*[><,.\-_*?+\/()@%&!$€=#]).*$/

		expect('j9l0k<a5ä.ö1dj-fj6laf').toMatch(regExp)
		expect('j2lkaä€ödjfjlaf').toMatch(regExp)
		expect(regExp.test('thisisates2tstri4ng')).toStrictEqual(false)
		expect(regExp.test('tämäontesti')).toStrictEqual(false)
		expect(regExp.test('tämäon_testi')).toStrictEqual(false)

		// Characters
		expect(
			await createPassphrase({
				dataset,
				passLength: '30',
				inputs: testData({ randomCharactersInString: true, numbers: true }),
			}),
		).toMatch(regExp)

		// Words
		expect(
			await createPassphrase({
				dataset,
				passLength: '5',
				inputs: testData({ word: true, randomCharactersInString: true, numbers: true }),
			}),
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
		const passphrase = await createPassphrase({
			dataset,
			passLength: '2',
			inputs: testData({
				word: true,
				inputFieldValueFromUser: splitter,
			}),
		})
		expect(passphrase).toContain(splitter)

		const splitStringArr = passphrase.split(splitter)
		expect(splitStringArr).toHaveLength(2)
	})

	it('Should have correct amount of splitter characters', async () => {
		const splitter = '?'
		const regExp = /[?]/g
		const passphrase = await createPassphrase({
			dataset,
			passLength: '3',
			inputs: testData({
				word: true,
				inputFieldValueFromUser: splitter,
			}),
		})
		expect(passphrase).toContain(splitter)

		const splitterArr = passphrase.match(regExp)
		expect(splitterArr).toStrictEqual(['?', '?'])
	})
})
