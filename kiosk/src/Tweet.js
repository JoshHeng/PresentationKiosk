import styles from './Tweet.module.css';
import TwitterIcon from './resources/twitterIcon';

const tweet = {
	user: {
		name: 'Youth STEM 2030',
		handle: '@YouthSTEM2030',
		avatar: 'https://pbs.twimg.com/profile_images/1234886467123662850/H9DLCQci_400x400.jpg'
	},
	tweet: "Welcome to the Research Conference! #YouthSTEMMattersResearchConf"
};

export default function Tweet() {
	return (
		<div className={styles.tweet}>
			<div className={styles.tweetTop}>
				<div>
					<img className={styles.avatar} src={tweet.user.avatar} alt="Twitter Avatar" />
					<p className={styles.name}>{tweet.user.name}</p>
					<span className={styles.handle}>{tweet.user.handle}</span>
				</div>
				<TwitterIcon />
			</div>
			
			<p>{tweet.tweet}</p>
		</div>
	)
}