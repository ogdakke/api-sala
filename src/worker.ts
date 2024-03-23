import {
	PRESHARED_AUTH_HEADER_KEY,
	apiErrors,
	defaultLengthOfPassphrase,
	defaultResponse,
	getConfig,
	headers,
	validLanguages,
} from './config'
import { Env, Language, PassphraseRequestData, SimpleJsonRequestSchema } from './models'
import { createPassphrase, validateSecret } from './services'
import { isIncludedInArray } from './utils'

const handler: ExportedHandler = {
	async fetch(request: Request, env) {
		/**
		 * OPTIONS method for API
		 */
		if (request.method === 'OPTIONS') {
			// Respond to the preflight request with the appropriate headers
			return new Response(null, { status: 200, headers })
		}

		/**
		 * API key from env. Locally read from .dev.vars | in prod from configuration
		 */
		const apiKey = (env as Env)[PRESHARED_AUTH_HEADER_KEY]

		/**
		 * The user sent key, that will be compared with apiKey if the origin is correct
		 */
		const sentApiKey = request.headers.get(PRESHARED_AUTH_HEADER_KEY)
    const origin = request.headers.get('Origin')
    
		if (sentApiKey === null && origin !== (env as Env).APP_URL) {
			return new Response(JSON.stringify({ error: apiErrors.noAuthorizationKey }), {
				status: 403,
				headers: headers,
			})
		}

    if (sentApiKey && origin !== (env as Env).APP_URL) {
      /**
       * If validation fails, eg. Keys do not match.
      */
		const validation = validateSecret({
      consumerSecret: sentApiKey,
			masterSecret: apiKey,
		})
		if (!validation.valid) {
      console.log(validation.log)
      
			return new Response(
        JSON.stringify({
          error: apiErrors.notAuthorized,
				}),
				{ status: 401, headers: headers },
        )
      }
    }
      
		/**
		 * GET, POST methods for API
		 */
		if (request.method === 'GET') {
			const url = new URL(request.url)
			// Check if the request is for the dataset
			if (url.pathname.startsWith('/dataset/')) {
				const language = url.pathname.split('/')[2] as Language

				if (!validLanguages.includes(language)) {
					throw new Error(apiErrors.languageIsNotSupported)
				}
				try {
					const dataset = await (env as Env).SALA_STORE_BUCKET.get(`${language}.json`)
					if (!dataset) {
						return new Response(apiErrors.errorFetchingBucket, { status: 404, headers })
					}

					return new Response(dataset.body, {
						headers: {
							...headers,
							'Content-Length': dataset.size.toString(),
							'Cache-Control': 'max-age=31536000',
						},
					})
				} catch (error) {
					return new Response(apiErrors.errorFetchingBucket, { status: 500,
						headers,
					})
				}
			}

			// Else continue with generating passphase
			const extractedParams = extractSearchParams(url)
			try {
				const requestData = mapRequestParametres(extractedParams)

				const isUsingWords = requestData.data.words.selected
				return handleLoadingOfDataset({
					isUsingWords,
					env: env as Env,
					requestData,
				})
			} catch (error) {
				if (error instanceof Error) {
					return new Response(
						JSON.stringify({
							error: error.message,
						}),
						{
							status: 400,
							headers: headers,
						},
					)
				}
			}
		} else if (request.method === 'POST') {
			const requestData = mapRequestParametres((await request.json()) as PassphraseRequestData)
			try {
				const isUsingWords = requestData.data.words.selected
				return handleLoadingOfDataset({
					isUsingWords,
					env: env as Env,
					requestData,
				})
			} catch (error) {
				if (error instanceof Error) {
					return new Response(
						JSON.stringify({
							error: error.message,
						}),
						{
							status: 400,
							headers: headers,
						},
					)
				}
			}
		}

		return new Response(apiErrors.wrongMethod, {
			status: 405,
			headers: headers,
		})
	},
}

async function handleLoadingOfDataset({
	isUsingWords,
	env,
	requestData,
}: {
	isUsingWords: boolean
	env: Env
	requestData: PassphraseRequestData
}) {
	if (isUsingWords) {
		const dataset = await getDataSet({ env: env as Env, requestData })
		return generateAndRespond(requestData, dataset)
	}
	return generateAndRespond(requestData)
}

async function getDataSet({ env, requestData }: { env: Env; requestData: PassphraseRequestData }) {
	const start = performance.now()
	const {
		data: { language },
	} = requestData

	if (!isIncludedInArray({ value: language, arr: validLanguages })) {
		throw new Error(apiErrors.languageIsNotSupported)
	}
	try {
		const dataset = await env.SALA_STORE_BUCKET.get(requestData.data.language + '.json')

		const end = performance.now()
		console.log(
			JSON.stringify({
				message: 'Succeeded in fetching dataset',
				time: end - start,
			}),
		)

		return dataset
	} catch (error) {
		const end = performance.now()
		console.error({
			message: apiErrors.errorFetchingBucket,
			requestData: JSON.stringify(requestData.data),
			error: error,
			time: end - start,
		})
		throw new Error(apiErrors.errorFetchingBucket)
	}
}

async function generateAndRespond(requestData: PassphraseRequestData, bucket?: R2ObjectBody | null): Promise<Response> {
	const { passLength, data } = requestData

	// If no bucket is supplied, eg. words are not being used
	if (bucket === undefined) {
		try {
			const password = await createPassphrase({ passLength, inputs: data })

			return new Response(
				JSON.stringify({
					passphrase: password,
					passLength: password.length,
				}),
				{ status: 200, headers: headers },
			)
		} catch (error) {
			console.error({ error: error })
			if (error instanceof Error) {
				return new Response(JSON.stringify({ error: error.message }), {
					status: 400,
					headers: headers,
				})
			}
		}
	}
	// A bucket was supplied
	// It might be null due to some other issue, but it's not undefined
	const dataset = await bucket?.json<string[]>()
	try {
		if (dataset == null) {
			throw new Error(apiErrors.errorFetchingBucket)
		}
		const passphrase = await createPassphrase({
			dataset,
			passLength,
			inputs: data,
		})
		return new Response(
			JSON.stringify({
				passphrase: passphrase,
				passLength: passphrase.length,
			}),
			{ status: 200, headers: headers },
		)
	} catch (error) {
		console.error({ error: error })
		if (error instanceof Error) {
			return new Response(JSON.stringify({ error: error.message }), {
				status: 400,
				headers: headers,
			})
		}
	}
	// Ideally, this shouldn't be reached.
	return new Response('Unexpected server error', {
		status: 500,
		headers: headers,
	})
}

/**
 * extract all needed params from the url
 */
function extractSearchParams(url: URL): SimpleJsonRequestSchema {
	const language = url.searchParams.get('lang') as Language
	const passLength = url.searchParams.get('passLength')
	const words = url.searchParams.get('words') === 'true'
	const separator = url.searchParams.get('separator')
	const randomChars = url.searchParams.get('randomChars') === 'true'
	const numbers = url.searchParams.get('numbers') === 'true'
	const uppercase = url.searchParams.get('uppercase') === 'true'

	return {
		language,
		passLength,
		words,
		numbers,
		randomChars,
		separator,
		uppercase,
	}
}

function mapRequestParametres(params: SimpleJsonRequestSchema): PassphraseRequestData {
	const { language, passLength, words, numbers, randomChars, separator, uppercase } = params

	if (!language) {
		console.log({
			message: apiErrors.languageParamIsNull,
			params: params,
		})

		throw new Error(apiErrors.languageParamIsNull)
	}

	if (!isIncludedInArray({ value: language, arr: validLanguages })) {
		console.log({
			message: apiErrors.languageIsNotSupported,
			params: params,
		})

		throw new Error(apiErrors.languageIsNotSupported)
	}

	const { minLengthForChars } = getConfig(language)

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
