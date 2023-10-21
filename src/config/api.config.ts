import { validLanguages } from './generation.config'

/**
 * Custom header key to check for apiKey
 */
const PRESHARED_AUTH_HEADER_KEY = 'X-API-KEY'

const headers = {
	'Content-Type': 'application/json',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': `${PRESHARED_AUTH_HEADER_KEY}`,
	'Cache-Control': 'no-cache, no-store, must-revalidate',
}

const apiErrors = {
	noAuthorizationKey: 'No authorization key found',
	notAuthorized: 'Provided key is not authorized',
	errorFetchingBucket: 'Failed to fetch word set',
	wrongMethod: 'Only GET and POST requests are allowed',
	languageParamIsNull: 'Language parameter was null',
	languageIsNotSupported: `Language is not supported. Supported languages are: '${validLanguages}'`,
}

export { PRESHARED_AUTH_HEADER_KEY, apiErrors, headers }
