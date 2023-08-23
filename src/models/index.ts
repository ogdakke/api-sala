export type InputLabel = 'words' | 'uppercase' | 'titlecase' | 'numbers' | 'randomChars'

export interface InputValue {
	value?: string // used in randomchars
	selected: boolean
}

export type IndexableInputValue = {
	[key in InputLabel]: InputValue
}
