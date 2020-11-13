import { encode as encodeBase58, decode as decodeBase58 } from 'micro-base58';
import { hexChars, getValue } from './pxt-functions';

export function toShort(source, version = 2) {
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

	let encodedData;
	if (version === 2) {
		encodedData = toShortV2(pixelData);
	} else if (version === 1) {
		encodedData = toShortV1(pixelData);
	} else {
		// unknown version
		return;
	}

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

export function fromShort(source) {
	let decoded;
	try {
		decoded = [...decodeBase58(source)];
	} catch {
		return;
	}

	const [versionAndWidthHigh, widthLow, ...pixelData] = decoded;

	const widthHigh = versionAndWidthHigh & 0xf;
	const imgWidth = widthLow | (widthHigh << 8);

	if (imgWidth === 0) {
		return;
	}

	let decodedUnpacked;
	const version = versionAndWidthHigh >> 4;
	if (version === 2) {
		decodedUnpacked = fromShortV2(pixelData, imgWidth);
	} else if (version === 1) {
		decodedUnpacked = fromShortV1(pixelData, imgWidth);
	} else {
		// unknown version
		return;
	}

	if (decodedUnpacked.length % imgWidth !== 0) {
		return;
	}

	// from https://github.com/microsoft/pxt/blob/e325bad9babaa43f7b6f7eacd930db5b9b6ffed1/pxtlib/spriteutils.ts#L687
	const paddingBetweenPixels = decodedUnpacked.length > 300 ? '' : ' ';

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
		.map((x) => x.join(paddingBetweenPixels))
		.join('\n');

	return `img\`\n${imgData}\n\``;
}

function fromShortV1(pixelData, imgWidth) {
	const decodedUnpacked = pixelData.reduce((acc, curr) => {
		acc.push(curr & 0x0f);
		acc.push(curr >> 4);
		return acc;
	}, []);

	if (decodedUnpacked.length % imgWidth === 1) {
		// trim extra half byte value off end
		decodedUnpacked.splice(-1, 1);
	}

	return decodedUnpacked;
}

function fromShortV2(pixelData) {
	const decodedUnpacked = [];
	for (let i = 0; i < pixelData.length; i++) {
		const value = pixelData[i] & 0x0f;
		let repeatCount = pixelData[i] >> 4;
		if (repeatCount) {
			if (repeatCount === 15) {
				i++;

				while (pixelData[i] === 255) {
					repeatCount += 255;
					i++;
				}

				repeatCount += pixelData[i];
			}

			decodedUnpacked.push(
				...Array.from({ length: repeatCount }, () => value)
			);
		} else {
			let pixelCount = pixelData[i];
			if (pixelCount === 15) {
				i++;

				while (pixelData[i] === 255) {
					pixelCount += 255;
					i++;
				}

				pixelCount += pixelData[i];
			}

			while (pixelCount) {
				i++;
				decodedUnpacked.push(pixelData[i] & 0x0f);
				pixelCount--;
				if (pixelCount) {
					decodedUnpacked.push(pixelData[i] >> 4);
					pixelCount--;
				}
			}
		}
	}

	return decodedUnpacked;
}
