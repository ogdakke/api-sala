export function validateSecret(consumerSecret: string, suppliedSecret: string) {
	const consumerUINT = new TextEncoder().encode(consumerSecret)
	const apiSecret = new TextEncoder().encode(suppliedSecret)

	if (consumerUINT.byteLength !== apiSecret.byteLength) {
		return false
	}

	let equal = crypto.subtle.timingSafeEqual(consumerUINT, apiSecret)

	if (equal) {
		return true
	} else {
		return false
	}
}
