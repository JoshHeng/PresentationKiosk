import styles from './Tweet.module.css';
import TwitterIcon from '../../Resources/twitterIcon';

const tweet = {
	user: {
		name: 'Youth STEM 2030',
		handle: '@YouthSTEM2030',
		avatar: 'https://pbs.twimg.com/profile_images/1234886467123662850/H9DLCQci_400x400.jpg'
	},
	tweet: "Welcome to the Research Conference! #YouthSTEMMattersResearchConf"
};

export default function Tweet({ tweetData }) {
	if (!tweetData || !tweetData.author) return <p>Bad</p>;

	return (
		<div className={styles.tweet}>
			<div className={styles.tweetTop}>
				<div>
					<img className={styles.avatar} src={tweet.author.avatar} alt="Twitter Avatar" />
					<p className={styles.name}>{tweet.author.name}</p>
					<span className={styles.handle}>{tweet.author.username}</span>
				</div>
				<TwitterIcon />
			</div>
			
			<p>{tweet.tweet}</p>
		</div>
	)
}