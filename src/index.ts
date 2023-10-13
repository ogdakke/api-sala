import { Env } from './models'

/** R2 bucket methods */
export default {
	async fetch(request: Request, env: Env) {
		const url = new URL(request.url)
		const key = url.pathname.slice(1)

		switch (request.method) {
			case 'GET':
				const object = await env.SALA_STORE_BUCKET.get(key)

				if (object === null) {
					return new Response('Object Not Found', { status: 404 })
				}

				const headers = new Headers()
				object.writeHttpMetadata(headers)
				headers.set('etag', object.httpEtag)

				return new Response(object.body, {
					headers,
				})
			default:
				return new Response('Method Not Allowed', {
					status: 405,
					headers: {
						Allow: 'GET',
					},
				})
		}
	},
}
