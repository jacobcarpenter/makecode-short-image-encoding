import { encode as encodeBase58 } from 'micro-base58';
import { getValue } from './pxt-functions';

export function toShort(source, version = 2) {
	if (!source) {
		return;
	}

	let encoder;
	if (version === 2) {
		encoder = toShortV2;
	} else if (version === 1) {
		encoder = toShortV1;
	} else {
		// unknown version
		return;
	}

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
	if (!imgWidth || !lines.every((line) => line.length === imgWidth)) {
		return;
	}

	const pixelData = lines.flatMap((x) => x.split('')).map(getValue);
	const encodedData = encoder(pixelData);

	return encodeBase58(
		Uint8Array.from([
			(version << 4) | ((imgWidth >> 8) & 0xf),
			imgWidth & 0xff,
			...encodedData,
		])
	);
}

function toShortV1(pixelData) {
	return pixelData.reduce((acc, curr, index) => {
		if (index % 2 === 0) {
			acc.push(curr);
		} else {
			acc[acc.length - 1] |= curr << 4;
		}
		return acc;
	}, []);
}

function toShortV2(pixelData) {
	const groupedConsecutive = pixelData.reduce((acc, curr) => {
		if (acc.length && acc[acc.length - 1].value === curr) {
			acc[acc.length - 1].count++;
		} else {
			acc.push({ value: curr, count: 1 });
		}
		return acc;
	}, []);

	const groupedAll = groupedConsecutive.reduce((acc, curr) => {
		if (curr.count < 3) {
			let values;
			if (acc.length && acc[acc.length - 1].count === 1) {
				values = acc[acc.length - 1].values;
			} else {
				values = [];
				acc.push({ values, count: 1 });
			}
			for (let i = 0; i < curr.count; i++) {
				values.push(curr.value);
			}
		} else {
			acc.push(curr);
		}
		return acc;
	}, []);

	const repeatEncoded = groupedAll.reduce((acc, curr) => {
		if (curr.count === 1) {
			// non-repeated pixels; record length of run and pack using the v1 strategy
			const prefixPattern = [];
			let nonRepeatCount = curr.values.length;
			if (nonRepeatCount >= 15) {
				prefixPattern.push(0x0f);
				nonRepeatCount -= 15;
			}

			while (nonRepeatCount >= 255) {
				prefixPattern.push(0xff);
				nonRepeatCount -= 255;
			}

			// must write a remaining count even if remaining is 0
			prefixPattern.push(nonRepeatCount);

			acc.push(...prefixPattern, ...toShortV1(curr.values));
		} else {
			// repeated pixels; record length and value to repeat
			let repeatInstructions = [curr.value];

			if (curr.count < 15) {
				repeatInstructions[0] |= curr.count << 4;
			} else {
				repeatInstructions[0] |= 0xf0;

				let remainingCount = curr.count - 15;
				while (remainingCount >= 255) {
					repeatInstructions.push(0xff);
					remainingCount -= 255;
				}

				// must write remaining count even if remaining is 0
				repeatInstructions.push(remainingCount);
			}

			acc.push(...repeatInstructions);
		}

		return acc;
	}, []);

	return repeatEncoded;
}
