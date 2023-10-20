import { SecretParams, SecretValidationResponse } from '../models'

export function validateSecret({ consumerSecret, suppliedSecret }: SecretParams): SecretValidationResponse {
	const consumerUINT = new TextEncoder().encode(consumerSecret)
	const apiSecret = new TextEncoder().encode(suppliedSecret)

	if (consumerUINT.byteLength !== apiSecret.byteLength) {
		return {
			log: `Secrets varied by length`,
			valid: false,
		}
	}

	const equal = crypto.subtle.timingSafeEqual(consumerUINT, apiSecret)

	if (equal) {
		return {
			log: 'Secrets were equal',
			valid: true,
		}
	} else {
		return {
			log: 'Secrets were not equal',
			valid: false,
		}
	}
}
