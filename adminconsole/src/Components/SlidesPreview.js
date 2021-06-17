import { useEffect, useState } from 'react';
import { Table, Image, Space, Button, InputNumber, Tag, Avatar } from 'antd';
import socket from '../socket';

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
					<p style={{ color: '#555', marginTop: '0.3rem', fontSize: '0.9em' }}><Avatar src={item.author.avatar} size="small" style={{ marginRight: '0.5rem' }} />By { item.author.name } ({item.author.username})</p>
				</div>
			);
		default:
			return 'Invalid Type';
	}
}

function SlideTable({ type, slides }) {
	if (type === 'bottombar') return (
		<Table rowKey="position" dataSource={slides} pagination={false}>
			<Table.Column title="Content" dataIndex="content" render={(val, item) => <BottomBarSlideContent item={item} />} />
			<Table.Column title="Type" dataIndex="type" render={val => <BottomBarTag type={val} />} />
			<Table.Column title="ID" dataIndex="id" width="2rem" />
			<Table.Column title="Queue" dataIndex="queue" key="queue" />
			<Table.Column title="Duration" dataIndex="duration" key="duration" />
		</Table>
	);

	return (
		<Table rowKey="position" dataSource={slides} pagination={false}>
			<Table.Column title="Slide" dataIndex="src" width="10rem" render={val => <div style={{ textAlign: 'center' }}><Image src={val} alt="Slide Image" height="5rem" /></div>} />
			<Table.Column title="ID" dataIndex="id" width="2rem" />
			<Table.Column title="Description" dataIndex="description" key="description" />
			<Table.Column title="Queue" dataIndex="queue" key="queue" />
			<Table.Column title="Duration" dataIndex="duration" key="duration" />
		</Table>
	);
}

export default function Slides({ type }) {
	const [ slides, setSlides ] = useState([]);

	useEffect(() => {
		if (type === 'bottombar') socket.on('bottombar.set', _slides => setSlides(_slides));
		else socket.on('slides.set', _slides => setSlides(_slides));

		if (type === 'bottombar') socket.emit('bottombar.request');
		else socket.emit('slides.request');
	}, [type]);

	function onPreviousSlide() {
		if (type === 'bottombar') socket.emit('bottombar.previous');
		else socket.emit('slides.previous');
	}
	function onAdvanceSlide() {
		if (type === 'bottombar') socket.emit('bottombar.next');
		else socket.emit('slides.next');
	}

	return (
		<>
			<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
				<Space>
					<Button onClick={onPreviousSlide}>Previous { type === 'bottombar' ? 'Item' : 'Slide' }</Button>
					<Button type="primary" onClick={onAdvanceSlide}>Next { type === 'bottombar' ? 'Item' : 'Slide' }</Button>
				</Space>
				<div>
					<label style={{ marginRight: '0.5rem' }}>Default Slide Duration (s)</label>
					<InputNumber />
				</div>
			</div>
			<SlideTable type={type} slides={slides} />
		</>
	);
}