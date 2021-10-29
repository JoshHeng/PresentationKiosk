/**
 * Handles social media on the bottom bar
 *
 */
const { config, saveConfig } = require('./config');

/**
 * Get all the posts
 * @returns {Object[]} Posts
 */
function getPosts() {
	return config.bottombar.queues.socials.items.map(id => {
		const social = config.bottombar.definitions[id];

		if (social.type === 'tweet') {
			return {
				id: id,
				type: 'twitter',
				tweet: social.tweet,
				user: social.author,
			};
		}
		else {
			return {
				id: id,
				type: 'instagram',
				content: social.content,
				user: social.author,
			};
		}
	});
}

/**
 * Set the posts from the admin console
 * @param {Object[]} rawInput
 * @returns {Object} Result
 */
function setPosts(rawInput) {
	try {
		const newQueue = [];
		const newDefinitions = {};

		for (const social of rawInput) {
			if (!social.id || !social.user) return { error: 'Invalid data' };
			if (!social.user.username) return { error: 'Missing username' };

			if (social.type === 'twitter') {
				if (!social.tweet) return { error: 'Missing tweet' };
				if (!social.user.avatar) return { error: 'Missing avatar' };
				if (!social.user.name) return { error: 'Missing name' };

				newDefinitions[social.id] = {
					type: 'tweet',
					tweet: social.tweet.slice(0, 256),
					author: {
						username: social.user.username.slice(0, 64),
						name: social.user.name.slice(0, 64),
						avatar: social.user.avatar.slice(0, 128),
					},
				};
			}
			else if (social.type === 'instagram') {
				if (!social.content) return { error: 'Missing Instagram post content' };

				newDefinitions[social.id] = {
					type: 'instagrampost',
					content: social.content.slice(0, 256),
					author: {
						username: social.user.username.slice(0, 64),
					},
				};
			}
			else {return { error: 'Invalid post type' };}

			newQueue.push(social.id);
		}

		for (const [ key, definition ] of Object.entries(config.bottombar.definitions)) {
			if (definition.type === 'tweet' || definition.type === 'instagrampost') delete config.bottombar.definitions[key];
		}

		config.bottombar.definitions = Object.assign(config.bottombar.definitions, newDefinitions);
		config.bottombar.queues.socials.items = newQueue;

		if (config.bottombar.queues.socials.position > newQueue.length) config.bottombar.queues.socials.position = 0;
		saveConfig();

		return { success: true };
	}
	catch (err) {
		console.log('Couldn\'t set socials');
		console.error(err);
		return { error: 'An error occured' };
	}
}

module.exports = { getPosts, setPosts };