# apisala - a passphrase api

it makes passphrases.

Now in either Finnish or English

## API Specification

### Headers

`X-API-KEY`: string

### Parametres

`"key": type`

```typescript
// default: 'fi'
lang: 'en' | 'fi'

// if false, a random string will be generated, if true, a passphrase consisting of random words will be generated.
// default: true
words: boolean

//between 4-128 if words=false, and 1-28 if words=true
// default: 3,
passLength: number
	restrictions: {
		words: (false = 4 - 128),
		words: (true = 1 - 28),
	}

// default: true
uppercase: boolean

// If words=false, add random characters in the result
// default: true
randomChars: boolean

// If words=true, add a separator/delimiter string between words
// default: '-'
separator: string

// Does result contain numbers
// default: true
numbers: boolean
```

### Dataset endpoint

```typescript
// /dataset endpoint returns json in the shape of string[]
// available datasets: 'en', 'fi'
// `/dataset/${lang}`
```
