import { createPassphrase } from './services/generate-passphrase'
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
}

const handler: ExportedHandler = {
	async fetch(request: Request) {
		if (request.method === 'POST') {
			const requestBody = (await request.json()) || undefined
			const passLength = requestBody?.passLength
			const data = requestBody?.data

			try {
				const passphrase = createPassphrase(passLength, data)
				return new Response(JSON.stringify({ passphrase }), { status: 200 })
			} catch (error) {
				return new Response(JSON.stringify({ error: error }), { status: 400 })
			}
		}

		return new Response('Only POST requests are allowed', { status: 405 })
	},
}
export default handler
