export type InputLabel = 'words' | 'uppercase' | 'numbers' | 'randomChars'

export interface InputValue {
	value?: string // used in randomchars
	selected: boolean
}

export interface IndexableInputValue {
	language: Lang
	words: InputValue
	uppercase: InputValue
	numbers: InputValue
	randomChars: InputValue
}

export type Lang = 'fi' | 'en' | 'se'
