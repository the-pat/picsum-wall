import {createWriteStream, unlink} from 'fs';
import {pipeline} from 'stream';
import {promisify} from 'util';
import {stream as gotStream, GotBodyOptions} from 'got';
import {default as meow} from 'meow';
import {file as tempFile} from 'tempy';
import {set as setWallpaper} from 'wallpaper';

const unlinkP = promisify(unlink);
const pipelineP = promisify(pipeline);

const cli = meow(`
	Usage
		$ picsum-wall [...]
	
	Options
		--width      Image width (default: 1920)
		--height     Image height (default: 1080)
		--grayscale  Get a grayscaled image
		--blur       Get a blurred image
		--id         Get a specific image from picsom.photos

	Examples
		$ picsum-wall
		$ picsum-wall --width=900
		$ picsum-wall --blur --grayscale
		$ picsum-wall --id 237
		
`, {
	flags: {
		width: {
			type: 'string',
			default: '1920'
		},
		height: {
			type: 'string',
			default: '1080'
		},
		grayscale: {
			type: 'boolean'
		},
		blur: {
			type: 'boolean'
		},
		id: {
			type: 'string',
			default: null
		}
	}
});

const gotOptions: GotBodyOptions<null> = {
	baseUrl: 'https://picsum.photos'
};

(async () => {
	const {width, height, grayscale, blur, id} = cli.flags;
	const file = tempFile({extension: 'jpg'});
	let url = `${width}/${height}`;
	const query = [];

	if (id) {
		url = `id/${id}/${url}`;
	}

	if (grayscale) {
		query.push('grayscale');
	}

	if (blur) {
		query.push('blur');
	}

	if (grayscale || blur) {
		gotOptions.query = query.join('&');
	}

	try {
		await pipelineP(
			gotStream(url, gotOptions),
			createWriteStream(file)
		);
		await setWallpaper(file);
		await unlinkP(file);
	} catch (error) {
		console.error(error);
	}
})();
