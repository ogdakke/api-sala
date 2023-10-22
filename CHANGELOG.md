# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## [1.1.1](https://github.com/ogdakke/api-sala/releases/1.1.1) - 22-10-2023

### Changed

- Handling case where words=false, to not load any dataset

## [1.1.0](https://github.com/ogdakke/api-sala/releases/1.1.0) - 21-10-2023

### Added

- introduced `getConfig(language)` for support of different alphabets, now generating a randomChar password with languge: 'en' doesn't use the Finnish alphabet.

### Changed

- update readme to reflect language option
- Clean up generation code
- Improve configs and imports
- Allow only GET on R2
- Error responses are better
- Better handling of R2 dataset fetching failing.
- Tests for changed createPassphrase() function

## [1.0.2](https://github.com/ogdakke/api-sala/releases/1.0.2) - 12-10-2023

### Added

- Move `<language>.json` files to an R2 bucket

### Changed

- Changed the way the dataset is used, due to switch to R2 buckets

## [1.0.1](https://github.com/ogdakke/api-sala/releases/1.0.1) - 12-10-2023

### Changed

- Added support for sending a number, not just a string for passLength.

### Fixed

- Tests failing, added proper error throwing exception handling for async functions as per vitest docs

## [1.0.0](https://github.com/ogdakke/api-sala/releases/1.0.0) - 12-10-2023

### Breaking

- changed `randomCharsValue` to `separator` for clarity

### Added

- Config is more notable, and used more efficiently
- Language switching feature, now with english as second language

### Changed

-

### Removed

-
