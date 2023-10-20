
import {
  PRESHARED_AUTH_HEADER_KEY,
  apiErrors,
  defaultLengthOfPassphrase,
  defaultResponse,
  headers,
  minLengthForChars,
} from './config'
import { Env, Language, PassphraseRequestData, SimpleJsonRequestSchema } from './models'
import { createPassphrase, validateSecret } from './services'

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
			return new Response(JSON.stringify({ error: apiErrors.noAuthorizationKey }), {
				status: 403,
				headers: headers,
			})
		}

		/**
		 * If validation fails, eg. Keys do not match.
		 */
    const validation = validateSecret(preSharedKey, apiKey)
		if (!validation.valid) {
			console.log(validation.log);
      
      return new Response(
				JSON.stringify({
					error: apiErrors.notAuthorized,
				}),
				{ status: 401, headers: headers },
			)
		}

		/**
		 * GET, POST methods for API
		 */
		if (request.method === 'GET') {
			const url = new URL(request.url)
			const extractedParams = extractSearchParams(url)
			const requestData = mapRequestParametres(extractedParams)
			const dataset = await (env as Env).SALA_STORE_BUCKET.get(requestData.data.language + '.json')
			return generateAndRespond(requestData, dataset)
		} else if (request.method === 'POST') {
			const requestData = mapRequestParametres((await request.json()) as PassphraseRequestData)
			const dataset = await (env as Env).SALA_STORE_BUCKET.get(requestData.data.language + '.json')
			return generateAndRespond(requestData, dataset)
		}

		return new Response(apiErrors.wrongMethod, {
			status: 405,
			headers: headers,
		})
	},
}

async function generateAndRespond(requestData: PassphraseRequestData, bucket: R2ObjectBody | null): Promise<Response> {
	const { passLength, data } = requestData
	const dataset = await bucket?.json<string[]>()
	try {
		if (dataset == null) {
			throw new Error(apiErrors.errorFetchingBucket)
		}
		const passphrase = await createPassphrase(dataset, passLength, data)
		return new Response(
			JSON.stringify({
				passphrase: passphrase,
				passLength: passphrase.length,
			}),
			{ status: 200, headers: headers },
		)
	} catch (error) {
		console.error(error)
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
function extractSearchParams(url: URL): SimpleJsonRequestSchema {
	const language = url.searchParams.get('lang') as Language
	const passLength = url.searchParams.get('passLength')
	const words = url.searchParams.get('words') === 'true'
	const separator = url.searchParams.get('separator')
	const randomChars = url.searchParams.get('randomChars') === 'true'
	const numbers = url.searchParams.get('numbers') === 'true'
	const uppercase = url.searchParams.get('uppercase') === 'true'

	return { language, passLength, words, numbers, randomChars, separator, uppercase }
}

function mapRequestParametres(params: SimpleJsonRequestSchema): PassphraseRequestData {
	const { language, passLength, words, numbers, randomChars, separator: separator, uppercase } = params

	return {
		passLength:
			passLength ||
			(words ?? defaultResponse.words.selected ? defaultLengthOfPassphrase : minLengthForChars.toString()),
		data: {
			language: language ?? defaultResponse.language,
			words: {
				selected: words ?? defaultResponse.words.selected,
			},
			randomChars: {
				value: separator ?? defaultResponse.randomChars.value,
				selected: randomChars ?? defaultResponse.randomChars.selected,
			},
			numbers: {
				selected: numbers ?? defaultResponse.numbers.selected,
			},
			uppercase: {
				selected: uppercase ?? defaultResponse.uppercase.selected,
			},
		},
	}
}

export default handler
