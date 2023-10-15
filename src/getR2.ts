import { Env } from './models'

export type FetchAndCacheOptions = {
	request: Request
	key: string
	env: Env
	context: any
}

async function fetchAndCache({ request, key, env, context }: FetchAndCacheOptions): Promise<Response | null> {
	const url = request.url
	const cache = caches.default
	const cacheKey = new Request(url.toString(), request)
	const cachedResponse = await cache.match(cacheKey)

	if (cachedResponse) {
		console.log(`Cache hit for key ${key}`)
		return cachedResponse
	}

	const object = await env.SALA_STORE_BUCKET.get(key)
	if (object === null) {
		console.log(`Object ${key} not found in R2 bucket`)
		return null
	}

	const headers = new Headers()
	object.writeHttpMetadata(headers)
	headers.set('etag', object.httpEtag)

	const response = new Response(object.body, {
		headers,
	})

	// Cache the object
	console.log(`Caching object ${key}`)
	context.waitUntil(cache.put(cacheKey, response.clone()))

	return response
}

export const fetchFromR2Bucket = async ({ request, key, env, context }: FetchAndCacheOptions) => {
	const response = await fetchAndCache({ request, key, env, context })
	return response
}

/** R2 bucket methods */
export default {
	async fetch(request: Request, env: Env, context) {
		try {
			const url = new URL(request.url)

			// Construct the cache key from the cache URL
			const cacheKey = new Request(url.toString(), request)
			const cache = caches.default

			// Check whether the value is already available in the cache
			// if not, you will need to fetch it from R2, and store it in the cache
			// for future access
			let response = await cache.match(cacheKey)

			if (response) {
				console.log(`Cache hit for: ${request.url}.`)
				return response
			}

			console.log(`Response for request url: ${request.url} not present in cache. Fetching and caching request.`)

			// If not in cache, get it from R2
			const objectKey = url.pathname.slice(1)
			const object = await env.SALA_STORE_BUCKET.get(objectKey)
			if (object === null) {
				return new Response('Object Not Found', { status: 404 })
			}

			// Set the appropriate object headers
			const headers = new Headers()
			object.writeHttpMetadata(headers)
			headers.set('etag', object.httpEtag)

			// Cache API respects Cache-Control headers. Setting s-max-age to 10
			// will limit the response to be in cache for 10 seconds max
			// Any changes made to the response here will be reflected in the cached value
			headers.append('Cache-Control', 's-maxage=1000')

			response = new Response(object.body, {
				headers,
			})

			// Store the fetched response as cacheKey
			// Use waitUntil so you can return the response without blocking on
			// writing to cache
			context.waitUntil(cache.put(cacheKey, response.clone()))

			return response
		} catch (error) {
			if (error instanceof Error) {
				return new Response('Error thrown ' + error.message)
			}
		}
	},
}
