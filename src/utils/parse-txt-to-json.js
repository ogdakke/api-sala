const fs = require('fs')

function parseTxtToJSON(inputPath, outputPath) {
	fs.readFile(inputPath, 'utf-8', (err, fileContent) => {
		if (err) {
			console.error(`Error reading the .txt file: ${err}`)
			return
		}

		// Split content by newline characters to get an array of words
		const wordsArray = fileContent.split(/\r?\n/).filter((word) => word.trim() !== '')

		fs.writeFile(outputPath, JSON.stringify(wordsArray, null, 4), 'utf-8', (err) => {
			if (err) {
				console.error(`Error writing to the .json file: ${err}`)
				return
			}

			console.log(`Words parsed and saved to ${outputPath}`)
		})
	})
}

const inputPath = process.argv[2]
const outputPath = process.argv[3]

if (!inputPath || !outputPath) {
	console.log('Usage: node parseToJSON.js <input_txt_file_path> <output_json_file_path>')
	void 0
}

parseTxtToJSON(inputPath, outputPath)
