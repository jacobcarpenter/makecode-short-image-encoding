import { toShort, fromShort } from '../src/shortImgEncoding';
import { getValue, hexChars } from '../src/pxt-functions';

describe('image round trips', () => {
	test.each([
		[
			'princess2Front',
			`img\`
. . . . . f f 4 4 f f . . . . . 
. . . . f 5 4 5 5 4 5 f . . . . 
. . . f e 4 5 5 5 5 4 e f . . . 
. . f b 3 e 4 4 4 4 e 3 b f . . 
. . f 3 3 3 3 3 3 3 3 3 3 f . . 
. f 3 3 e b 3 e e 3 b e 3 3 f . 
. f 3 3 f f e e e e f f 3 3 f . 
. f b b f b f e e f b f b b f . 
. f b b e 1 f 4 4 f 1 e b b f . 
f f b b f 4 4 4 4 4 4 f b b f f 
f b b f f f e e e e f f f b b f 
. f e e f b d d d d b f e e f . 
. . e 4 c d d d d d d c 4 e . . 
. . e f b d b d b d b b f e . . 
. . . f f 1 d 1 d 1 d f f . . . 
. . . . . f f b b f f . . . . . 
\``,
		],
		[
			'smallPizza',
			`img\`
. . . . . . b b b b . . . . . . 
. . . . . . b 4 4 4 b . . . . . 
. . . . . . b b 4 4 4 b . . . . 
. . . . . b 4 b b b 4 4 b . . . 
. . . . b d 5 5 5 4 b 4 4 b . . 
. . . . b 3 2 3 5 5 4 e 4 4 b . 
. . . b d 2 2 2 5 7 5 4 e 4 4 e 
. . . b 5 3 2 3 5 5 5 5 e e e e 
. . b d 7 5 5 5 3 2 3 5 5 e e e 
. . b 5 5 5 5 5 2 2 2 5 5 d e e 
. b 3 2 3 5 7 5 3 2 3 5 d d e 4 
. b 2 2 2 5 5 5 5 5 5 d d e 4 . 
b d 3 2 d 5 5 5 d d d 4 4 . . . 
b 5 5 5 5 d d 4 4 4 4 . . . . . 
4 d d d 4 4 4 . . . . . . . . . 
4 4 4 4 . . . . . . . . . . . . 
\``,
		],
		[
			'bigDonut',
			`img\`
..............bbbbbbb...........
...........bb66663333baa........
.........bb3367776333663aa......
........b33333888333389633aa....
.......b3333333333333389633aa...
......b34443333333333338633bae..
.....b3455433333333334443333ae..
....b33322333dddd3333455233daee.
...b3d333333dd3bbbb33322333dabe.
..b3d333333d3bb33bb33333333da4e.
..bd33333333b33aab3333333223a4ee
.b3d3663333b33aab33366332442b4ee
.bd3b983333a3aa3333387633ee3b4ee
.bd6983333baaa333333387633bb4bee
b3d6833333bba333333333863ba44ebe
bdd3333333bb3333333333333a44bebe
add666633333322333366333ba44bbbe
ad67776333332442336983d3a444b4e.
add888b333333ee3369833d3a44b44e.
add333333333333336833d3a444b4e..
a3dd3333344433333dddd3a444b44e..
ab33ddd325543333dd33aa444b44e...
.eabb3dd32233333baaa4444b44e....
.ebabb3d333d33baa444443b44e.....
..ebaab3ddd3aaa4444433b44e......
..eebbaab33a44444333b444e.......
...eeebbaab444b333b4444e........
....ebeeebbbbbbbb4444ee.........
.....eebbbb44444444ee...........
.......eeebbb444eee.............
..........eeeeee................
................................
\``,
		],
	])('%s', (name, img) => {
		const short = toShort(img);
		const img2 = fromShort(short);

		expect(img2).toBe(normalizeImage(img));
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
