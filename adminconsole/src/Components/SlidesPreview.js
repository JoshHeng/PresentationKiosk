import { useEffect, useState } from 'react';
import { Table, Image, Button, Tag, Avatar, Input, message } from 'antd';
import socket from '../socket';
import SocialsEditor from './SocialsEditor';

function BottomBarAnnouncement({ announcement }) {
	const [ announcementText, setAnnouncementText ] = useState('');
	function onToggle() {
		socket.emit('bottombar.announce', announcement ? false : announcementText, err => {
			if (err) message.error(err);
		});
	}

	return (
		<div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
			<label style={{ marginRight: '0.5rem' }}>Announcement</label>
			<Input maxLength={256} value={announcement || announcementText} onChange={e => setAnnouncementText(e.target.value)} disabled={!!announcement} />
			<Button type="primary" style={{ marginLeft: '0.1rem' }} onClick={onToggle}>{ announcement ? 'Clear' : 'Show' }</Button>
		</div>
	);
}

function BottomBarTag({ type }) {
	switch (type) {
		case 'text':
			return <Tag color="orange">Text</Tag>;
		case 'tweet':
			return <Tag color="blue">Tweet</Tag>;
		case 'instagrampost':
			return <Tag color="magenta">Instagram</Tag>;
		case 'blank':
			return <Tag>Blank</Tag>;
		case 'socials':
			return <Tag>Socials</Tag>
		default:
			return <Tag>{type}</Tag>
	}
}

function BottomBarSlideContent({ item }) {
	switch (item.type) {
		case 'text':
			return item.text;
		case 'tweet':
			return (
				<div>
					{ item.tweet }
					<p style={{ color: '#555', marginTop: '0.3rem', fontSize: '0.9em' }}><Avatar src={item.author.avatar} size="small" style={{ marginRight: '0.5rem' }} />By { item.author.name } (@{item.author.username})</p>
				</div>
			);
		case 'instagrampost':
			return (
				<div>
					{ item.content }
					<p style={{ color: '#555', marginTop: '0.3rem', fontSize: '0.9em' }}>By @{item.author.username}</p>
				</div>
			)
		case 'blank':
		case 'socials':
			return '';
		default:
			return 'Invalid Type';
	}
}

function SlideTable({ type, slides }) {
	if (type === 'bottombar') return (
		<Table rowKey="position" dataSource={slides} pagination={false} locale={{ emptyText: 'Loading/None' }} rowClassName={(event, index) => index === 0 ? 'current-row' : ''}>
			<Table.Column title="Content" dataIndex="content" render={(val, item) => <BottomBarSlideContent item={item} />} />
			<Table.Column title="Type" dataIndex="type" render={val => <BottomBarTag type={val} />} />
			<Table.Column title="ID" dataIndex="id" width="2rem" />
			<Table.Column title="Queue" dataIndex="queue" key="queue" render={val => <Tag>{val}</Tag>} />
			<Table.Column title="Duration" dataIndex="duration" key="duration" render={val => `${val/1000}s`} />
		</Table>
	);

	return (
		<Table rowKey="position" dataSource={slides} pagination={false} locale={{ emptyText: 'Loading/None' }} rowClassName={(event, index) => index === 0 ? 'current-row' : ''}>
			<Table.Column title="Slide" dataIndex="src" width="6rem" render={val => <div style={{ textAlign: 'center', width: '6rem' }}><Image src={val} alt="Slide Image" /></div>} />
			<Table.Column title="ID" dataIndex="id" width="2rem" />
			<Table.Column title="Description" dataIndex="description" key="description" />
			<Table.Column title="Queue" dataIndex="queue" key="queue" render={val => <Tag>{val}</Tag>} />
			<Table.Column title="Duration" dataIndex="duration" key="duration" render={val => `${val/1000}s`} width="2rem" />
		</Table>
	);
}

export default function Slides({ type, disabled }) {
	const [ slides, setSlides ] = useState([]);
	const [ paused, setPaused ] = useState(false);
	const [ announcement, setAnnouncement ] = useState(null);
	const [ editingSocials, setEditingSocials ] = useState(false);

	useEffect(() => {
		if (type === 'bottombar') {
			socket.on('bottombar.set', _slides => setSlides(_slides));
			socket.on('bottombar.pause', () => setPaused(true));
			socket.on('bottombar.resume', () => setPaused(false));
			socket.on('bottombar.announcement', val => setAnnouncement(val));
		}
		else {
			socket.on('slides.set', _slides => setSlides(_slides));
			socket.on('slides.pause', () => setPaused(true));
			socket.on('slides.resume', () => setPaused(false));
		}

		if (type === 'bottombar') socket.emit('bottombar.request');
		else socket.emit('slides.request');

		return () => {
			socket.off('slides.pause');
			socket.off('slides.resume');
			socket.off('bottombar.pause');
			socket.off('bottombar.resume');
			socket.off('bottombar.set');
			socket.off('slides.set');
			socket.off('bottombar.announcement')
		}
	}, [type]);

	function onPreviousSlide() {
		if (type === 'bottombar') socket.emit('bottombar.previous');
		else socket.emit('slides.previous');
	}
	function onAdvanceSlide() {
		if (type === 'bottombar') socket.emit('bottombar.next');
		else socket.emit('slides.next');
	}
	function onPauseSlides() {
		if (type === 'bottombar') socket.emit('bottombar.togglepause');
		else socket.emit('slides.togglepause');
	}

	return (
		<>
			<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
				<div>
					<Button type="primary" style={{ marginRight: '1rem' }} onClick={onPauseSlides} disabled={disabled}>{ paused ? 'Resume' : 'Pause' }</Button>
					<Button style={{ marginRight: '0.2rem' }} onClick={onPreviousSlide} disabled={disabled}>Previous { type === 'bottombar' ? 'Item' : 'Slide' }</Button>
					<Button onClick={onAdvanceSlide} disabled={disabled}>Next { type === 'bottombar' ? 'Item' : 'Slide' }</Button>
				</div>
				{ type === 'bottombar' && <>
					<Button style={{ marginLeft: 'auto' }} disabled={disabled} onClick={() => setEditingSocials(true)}>Edit Socials</Button>
					<SocialsEditor editing={editingSocials} onClose={() => setEditingSocials(false)} />
				</> }
			</div>

			{ type === 'bottombar' && <BottomBarAnnouncement announcement={announcement} /> }
			<SlideTable type={type} slides={slides} />
		</>
	);
}