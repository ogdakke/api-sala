import { minLengthForWords } from './config'
import { IndexableInputValue } from './models'
import { createPassphrase } from './services/generate-passphrase'
import { validateSecret } from './services/validate-secret'

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
	'X-API-KEY': string
}

/**
 * Custom header key to check for apiKey
 */
const PRESHARED_AUTH_HEADER_KEY = 'X-API-KEY'

const headers = {
	'Content-Type': 'application/json',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST',
	'Access-Control-Allow-Headers': `Origin, ${PRESHARED_AUTH_HEADER_KEY}, Content-Type, Accept`,
	'Cache-Control': 'no-cache, no-store, must-revalidate', // Disable caching for this dynamic content
}

const handler: ExportedHandler = {
	async fetch(request: Request, env) {
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
		 * GET method for API
		 */
		if (request.method === 'GET') {
			const url = new URL(request.url)
			const { passLength, data } = extractSearchParams(url)

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
					return new Response(JSON.stringify({ error: error.message }), { status: 400 })
				}
			}
		} else if (request.method === 'POST') {
			const { passLength, data }: PassphraseData = (await request.json()) || undefined
			console.log(data)

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
					return new Response(JSON.stringify({ error: error.message }), { status: 400 })
				}
			}
		}

		return new Response('Only GET and POST requests are allowed', {
			status: 405,
			headers: headers,
		})
	},
}
/**
 * extract all needed params from the url
 * @param url url to extract from
 * @returns passlength, data
 */
function extractSearchParams(url: URL) {
	// Extract parameters
	const passLength: string = url.searchParams.get('passLength') || minLengthForWords.toString()
	const data: IndexableInputValue = {
		language: url.searchParams.get('lang'),
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

interface PassphraseData {
	passLength: string
	data: IndexableInputValue
}

export default handler
