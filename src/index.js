import { html, render } from 'lit-html';
import { ifDefined } from 'lit-html/directives/if-defined';
import { toShort, fromShort } from './encoding';
import './styles.css';

const app = document.querySelector('#app');

const url = new URL(window.location);
const s = url.searchParams.get('s');
const imgData = fromShort(s) ?? getDefaultImageData();

update(imgData);

function update(imgData) {
	const s = toShort(imgData);
	const searchParams = s && new URLSearchParams({ s });
	const shortUrl = searchParams ? `/?${searchParams}` : `/`;

	window.history.replaceState(null, '', shortUrl);
	render(App({ img: imgData, shortUrl, s }), app);
}

function App({ img, s, shortUrl }) {
	return html`<div>
		<p>
			Paste image data into the <code>TEXTAREA</code> below to create a
			<a href=${shortUrl}>sharable url</a>.
		</p>
		<p>
			Copy from the <code>TEXTAREA</code> below to paste the image into
			MakeCode Arcade.
		</p>
		<div>
			<textarea
				class=${ifDefined(!s ? 'error' : undefined)}
				cols="60"
				rows="20"
				spellcheck="false"
				.value=${img}
				@input=${(e) => update(e.target.value)}
			></textarea>
		</div>
		${s && html`<p class="short-image">${s}</p>`}
		${s &&
		html`<p class="short-image">
			Original: ${img.length}; Shortened: ${s.length}
		</p>`}
		<p>
			<a
				href="https://github.com/jacobcarpenter/makecode-short-image-encoding"
				>View on Github</a
			>
		</p>
	</div>`;
}

function getDefaultImageData() {
	return `img\`
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
\``;
}
