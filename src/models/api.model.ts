import { IndexableInputValue, Language } from '.'

export interface Env {
	SALA_STORE_BUCKET: R2Bucket
	'X-API-KEY': string
}

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
