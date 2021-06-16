import styles from './Tweet.module.css';
import TwitterIcon from '../../Resources/twitterIcon';

export default function Tweet({ tweetData }) {
	if (!tweetData || !tweetData.author) return <p>Bad</p>;

	return (
		<div className={styles.tweet}>
			<div className={styles.tweetTop}>
				<div>
					<img className={styles.avatar} src={tweetData.author.avatar} alt="Twitter Avatar" />
					<p className={styles.name}>{tweetData.author.name}</p>
					<span className={styles.handle}>@{tweetData.author.username}</span>
				</div>
				<TwitterIcon />
			</div>
			
			<p>{tweetData.tweet}</p>
		</div>
	)
}