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

export type Language = 'fi' | 'en' | 'se'

export interface PassphraseRequestData {
	passLength: string
	data: IndexableInputValue
}

export interface SimpleJsonRequestSchema {
	language?: Language | null
	passLength?: string | null
	words?: boolean | null
	numbers?: boolean | null
	randomChars?: boolean | null
	separator?: string | null
	uppercase?: boolean | null
}
