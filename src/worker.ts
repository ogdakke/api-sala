import { minLengthForWords, validLanguages } from './config'
import { IndexableInputValue, Lang, PassphraseRequestData } from './models'
import { createPassphrase } from './services/generate-passphrase'
import { validateSecret } from './services/validate-secret'

export interface Env {
	'X-API-KEY': string
}

/**
 * Custom header key to check for apiKey
 */
const PRESHARED_AUTH_HEADER_KEY = 'X-API-KEY'

const headers = {
	'Content-Type': 'application/json',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': `${PRESHARED_AUTH_HEADER_KEY}, Content-Type`,
	'Cache-Control': 'no-cache, no-store, must-revalidate',
}

const handler: ExportedHandler = {
	async fetch(request: Request, env) {
		/**
		 * OPTIONS method for API
		 */
		if (request.method === 'OPTIONS') {
			// Respond to the preflight request with the appropriate headers
			return new Response(null, { status: 200, headers: headers })
		}

		/**
		 * API key from env. Locally read from .dev.vars | in prod from configuration
		 */
		const apiKey = (env as Env)[PRESHARED_AUTH_HEADER_KEY]

		/**
		 * The user sent key, that will be compared with apiKey
		 */
		const preSharedKey = request.headers.get(PRESHARED_AUTH_HEADER_KEY)

		if (preSharedKey == null) {
			return new Response(JSON.stringify({ error: 'no authorization key found' }), { status: 403, headers: headers })
		}

		/**
		 * If validation fails, eg. Keys do not match.
		 */
		if (!validateSecret(preSharedKey, apiKey)) {
			return new Response(
				JSON.stringify({
					error: 'not authorized',
					reason: 'Provided key is not authorized',
				}),
				{ status: 401, headers: headers },
			)
		}

		/**
		 * GET, POST methods for API
		 */
		if (request.method === 'GET') {
			const url = new URL(request.url)
			const requestData = extractSearchParams(url)
			return generateAndRespond(requestData)
		} else if (request.method === 'POST') {
			const requestData: PassphraseRequestData = (await request.json()) || undefined
			return generateAndRespond(requestData)
		}

		return new Response('Only GET and POST requests are allowed', {
			status: 405,
			headers: headers,
		})
	},
}

async function generateAndRespond(requestData: PassphraseRequestData): Promise<Response> {
	const { passLength, data } = requestData

	try {
		const passphrase = createPassphrase(passLength, data)
		return new Response(
			JSON.stringify({
				passphrase: passphrase,
				passLength: passphrase.length,
			}),
			{ status: 200, headers: headers },
		)
	} catch (error) {
		if (error instanceof Error) {
			return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: headers })
		}
	}
	// Ideally, this shouldn't be reached.
	return new Response('Unexpected server error', { status: 500, headers: headers })
}

/**
 * extract all needed params from the url
 * @param url url to extract from
 * @returns passlength
 * @returns data
 */
function extractSearchParams(url: URL): PassphraseRequestData {
	// Extract parameters
	const passLength: string = url.searchParams.get('passLength') || minLengthForWords.toString()

	const langFromParams = url.searchParams.get('lang') as Lang
	const lang: Lang = validLanguages.includes(langFromParams) ? langFromParams : 'fi'

	const data: IndexableInputValue = {
		language: lang,
		words: {
			selected: url.searchParams.get('words') === 'true',
		},
		randomChars: {
			value: url.searchParams.get('randomCharsValue') || '',
			selected: url.searchParams.get('randomChars') === 'true',
		},
		numbers: {
			selected: url.searchParams.get('numbers') === 'true',
		},
		uppercase: {
			selected: url.searchParams.get('uppercase') === 'true',
		},
	}

	return { passLength, data }
}

export default handler
