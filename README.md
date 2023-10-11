# apisala - a passphrase api

it makes passphrases.

Now in either Finnish or English

## API Specification

`"key": type | default`

```typescript
// if false, a random string will be generated, if true, a passphrase consisting of random words will be generated.
words: boolean | true

//between 4-128 if words=false, and 1-28 if words=true
passLength: number | 3,
	{
		words: (false = 4 - 128),
		words: (true = 1 - 28),
	}

uppercase: boolean | true

// If words=false, add random characters in the result
randomChars: boolean | true

// If words=true, add a separator/delimiter string between words
separator: string | '-'

// Does result contain numbers
numbers: boolean | true
```

## Development setup

```sh
pnpm i
```

```sh
pnpm start
```

Add your api key to the root `.dev.vars` -file
