import React, { useEffect, useState } from 'react';
import { Modal, Table, Input, message, Button, Tag, Space, Avatar } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import socket from '../socket';

export default function EditableSchedule({ editing, onClose }) {
	const [ data, setData ] = useState([]);

	useEffect(() => {
		if (editing) {
			setData([]);
			socket.emit('bottombar.socials.request', data => setData(data));
		}
	}, [editing])

	function onCancel() {
		onClose();
	}
	function onSubmit() {
		socket.emit('bottombar.socials.edit', data, error => {
			if (error) return message.error(error);
			onClose();
		});
	}
	function addTwitter() {
		let _data = data.slice();
		_data.push({ 
			id: `tweet-${Math.floor(Math.random()*10000)}`,
			type: 'twitter',
			user: {
				username: '',
				name: '',
				avatar: ''
			},
			tweet: '',
		});
		setData(_data);
	}
	function addInstagram() {
		let _data = data.slice();
		_data.push({ 
			id: `instagram-${Math.floor(Math.random()*10000)}`,
			type: 'instagram',
			user: {
				username: '',
				name: '',
			},
			content: '',
		});
		setData(_data);
	}
	function randomise() {
		let _data = data.slice();
		_data.sort(() => Math.random()-0.5);
		setData(_data);
	}

	return (
		<Modal title="Edit Socials" visible={editing} onOk={onSubmit} onCancel={onCancel} width={1200}>
			<Table dataSource={data ? data : []} locale={{ emptyText: 'Loading/None' }} rowKey="id">
				<Table.Column title="Type" dataIndex="type" render={value => value === 'twitter' ? <Tag color="blue">Twitter</Tag> : <Tag color="magenta">Instagram</Tag>} width="6rem" />
				<Table.Column title="Avatar" dataIndex="username" render={(_, social, index) => social.type === 'twitter' && <Space>
					<Avatar src={social.user.avatar} />
					<Input maxLength={128} value={social.user.avatar} onChange={event => {
						let _data = data.slice();
						_data[index] = Object.assign({}, data[index], { user: Object.assign({}, data[index].user, { avatar: event.target.value.slice(0, 128) })});
						setData(_data);
					}} placeholder="URL" />
				</Space>} width="10rem" />
				<Table.Column title="Username" dataIndex="username" render={(_, social, index) => <Input maxLength={64} value={social.user.username} onChange={event => {
					let _data = data.slice();
					_data[index] = Object.assign({}, data[index], { user: Object.assign({}, data[index].user, { username: event.target.value.slice(0, 64) })});
					setData(_data);
				}} prefix="@" />} width="15rem" />
				<Table.Column title="Name" dataIndex="name" render={(_, social, index) => social.type === 'twitter' && <Input maxLength={64} value={social.user.name} onChange={event => {
					let _data = data.slice();
					_data[index] = Object.assign({}, data[index], { user: Object.assign({}, data[index].user, { name: event.target.value.slice(0, 64) })});
					setData(_data);
				}} />} width="15rem" />
				<Table.Column title="Content" dataIndex="content" render={(_, social, index) => <Input.TextArea maxLength={256} value={social.content || social.tweet} onChange={event => {
					let _data = data.slice();
					if (social.type === 'instagram') _data[index] = Object.assign({}, data[index], { content: event.target.value.slice(0, 256) });
					else _data[index] = Object.assign({}, data[index], { tweet: event.target.value.slice(0, 256) });
					setData(_data);
				}} />} autoSize={{ minRows: 1, maxRows: 3 }} />
				<Table.Column dataIndex="delete" render={(value, event, index) => <Button danger icon={<DeleteOutlined />} onClick={() => {
					let _data = data.slice();
					_data.splice(index, 1);
					setData(_data);	
				}} />} width="2rem" />
			</Table>

			<Space style={{ marginTop: '1rem' }}>
				<Button onClick={addTwitter}>Add Tweet</Button>
				<Button onClick={addInstagram}>Add Instagram Post</Button>
				<Button onClick={randomise}>Randomise</Button>
			</Space>
		</Modal>
	);
};