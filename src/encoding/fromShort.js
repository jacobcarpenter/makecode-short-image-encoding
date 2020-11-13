import { decode as decodeBase58 } from 'micro-base58';
import { hexChars } from './pxt-functions';

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
