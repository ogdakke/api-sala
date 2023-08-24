export function validateSecret(consumerSecret: string, suppliedSecret: string) {
	const encoder = new TextEncoder()

	const consumerUINT = new TextEncoder().encode(consumerSecret)
	const apiSecret = new TextEncoder().encode(suppliedSecret)

	if (consumerUINT.byteLength !== apiSecret.byteLength) {
		// Strings must be the same length in order to compare
		// with crypto.timingSafeEqual
		return false
	}

	// The below code is vulnerable to timing attacks
	// if (consumerUINT === apiSecret) { ... }

	let equal = crypto.subtle.timingSafeEqual(consumerUINT, apiSecret)

	if (equal) {
		// The values are equal
		return true
	} else {
		// The values are not equal
		return false
	}
}
