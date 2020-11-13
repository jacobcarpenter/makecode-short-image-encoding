import { toShort, fromShort } from '../src/encoding';
import { getValue, hexChars } from '../src/encoding/pxt-functions';
import { testData } from './testData';

describe('image round trips', () => {
	describe('with default encoding', () => {
		test.each(testData)('%s', (name, img) => {
			const short = toShort(img);
			const roundtripped = fromShort(short);

			expect(roundtripped).toBe(normalizeImage(img));
		});
	});

	describe('with V2 encoding', () => {
		test.each(testData)('%s', (name, img) => {
			const short = toShort(img, 2);
			const roundtripped = fromShort(short);

			expect(roundtripped).toBe(normalizeImage(img));
		});
	});

	describe('with V1 encoding', () => {
		test.each(testData)('%s', (name, img) => {
			const short = toShort(img, 1);
			const roundtripped = fromShort(short);

			expect(roundtripped).toBe(normalizeImage(img));
		});
	});
});

function normalizeImage(img) {
	const data = img.match(/img`([^`]+)`/m);
	const lines = data[1].split('\n');
	const trimmedFilteredLines = lines
		.map((line) => line.replace(/\s+/g, ''))
		.filter((line) => line);

	const paddingBetweenPixels =
		trimmedFilteredLines.reduce((acc, line) => acc + line.length, 0) > 300
			? ''
			: ' ';

	const normalizedLines = trimmedFilteredLines.map((line) =>
		line
			.split('')
			.map((ch) => hexChars[getValue(ch)])
			.join(paddingBetweenPixels)
	);
	return `img\`
${normalizedLines.join('\n')}
\``;
}
