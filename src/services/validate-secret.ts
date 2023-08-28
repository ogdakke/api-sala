export function validateSecret(consumerSecret: string, suppliedSecret: string) {
	const consumerUINT = new TextEncoder().encode(consumerSecret)
	const apiSecret = new TextEncoder().encode(suppliedSecret)

	if (consumerUINT.byteLength !== apiSecret.byteLength) {
		return false
	}

	const equal = crypto.subtle.timingSafeEqual(consumerUINT, apiSecret)

	if (equal) {
		// The values are equal
		return true
	} else {
		// The values are not equal
		return false
	}
}
