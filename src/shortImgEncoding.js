import { encode as encodeBase58, decode as decodeBase58 } from 'micro-base58';
import { hexChars, getValue } from './pxt-functions';

// First byte:
// high 4 bits: version identifier: 0001
// low 4 bits: high bits of a 12-bit image width value

// Second byte:
// all 8 bits: low bits of a 12-bit image width value; supports widths 1 - 4,095 [zero is an invalid value]

// Remaining bytes:
// packed image data: pairs of consecutive pixel values are packed into a single byte
// low 4 bits: first pixel of pair
// high 4 bits: second pixel of pair

export function toShort(source) {
	// modified from https://github.com/microsoft/pxt/blob/ed6180765c67f822b312eb3ea27f6e4b8faf4a3b/webapp/src/components/ImageEditor/ImageCanvas.tsx#L378-L379
	const matched = source.match(
		/img(`|\(""")([\s\da-f.#tngrpoyw]+)(`|"""\))/im
	);
	if (!matched) {
		return;
	}

	const imgData = matched[2];
	const lines = imgData
		.split('\n')
		.map((x) => x.replace(/\s+/g, ''))
		.filter((x) => x);

	const imgWidth = lines[0]?.length;
	if (!imgWidth) {
		return;
	}

	const pixelData = lines.flatMap((x) => x.split('')).map(getValue);
	const packedData = pixelData.reduce((acc, curr, index) => {
		if (index % 2 === 0) {
			acc.push(curr);
		} else {
			acc[acc.length - 1] |= curr << 4;
		}
		return acc;
	}, []);

	return encodeBase58(
		Uint8Array.from([
			(1 << 4) | ((imgWidth >> 8) & 0xf),
			imgWidth & 0xff,
			...packedData,
		])
	);
}

export function fromShort(source) {
	let decoded;
	try {
		decoded = [...decodeBase58(source)];
	} catch {
		return;
	}

	const [versionAndWidthHigh, widthLow, ...pixelData] = decoded;

	const version = versionAndWidthHigh >> 4;
	if (version !== 1) {
		return;
	}

	const widthHigh = versionAndWidthHigh & 0xf;
	const imgWidth = widthLow | (widthHigh << 8);

	if (imgWidth === 0) {
		return;
	}

	const decodedUnpacked = pixelData.reduce((acc, curr) => {
		acc.push(curr & 0x0f);
		acc.push(curr >> 4);
		return acc;
	}, []);

	if (decodedUnpacked.length % imgWidth !== 0) {
		// trim extra half byte value off end
		decodedUnpacked.splice(-1, 1);
	}

	const imgData = decodedUnpacked
		.map((x) => hexChars[x])
		.reduce((acc, curr) => {
			if (acc.length && acc[acc.length - 1].length < imgWidth) {
				acc[acc.length - 1].push(curr);
			} else {
				acc.push([curr]);
			}
			return acc;
		}, [])
		.map((x) => x.join(' '))
		.join('\n');

	return `img\`\n${imgData}\n\``;
}
