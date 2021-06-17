import styles from './Social.module.css';
import TwitterIcon from '../../Resources/twitterIcon';

export default function Tweet({ socialData }) {
	if (!socialData || !socialData.author) return <p>Bad</p>;

	return (
		<div className={styles.social}>
			<div className={styles.socialTop}>
				<div>
					{ socialData.type === 'tweet' && <img className={styles.avatar} src={socialData.author.avatar} alt="Avatar" /> }
					<p className={styles.name}>{socialData.author.name || '@' + socialData.author.username}</p>
					{ socialData.type === 'tweet' && <span className={styles.handle}>@{socialData.author.username}</span> }
				</div>
				{ socialData.type === 'tweet' ? <TwitterIcon /> : <img src="/images/instagram.jpg" alt="Instagram logo" />}
			</div>
			
			<p>{socialData.tweet || socialData.content}</p>
		</div>
	)
}