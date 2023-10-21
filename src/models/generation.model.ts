export type InputKeys = 'words' | 'uppercase' | 'numbers' | 'randomChars' | 'language' | 'passLength' | 'separator'

export type PassLength = string | number

export interface InputValue {
	value?: string // used in randomchars
	selected: boolean
}

export interface IndexableInputValue {
	language: Language
	words: InputValue
	uppercase: InputValue
	numbers: InputValue
	randomChars: InputValue
}

export type Language = 'fi' | 'en'
