import React, { useEffect, useState } from 'react';
import { Modal, Table, Input, TimePicker, message, Button, Space } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import moment from 'moment';
import socket from '../socket';

export default function EditableSchedule({ editing, onClose, oldValue }) {
	const [ data, setData ] = useState(oldValue);

	useEffect(() => {
		if (editing) setData(oldValue);
	// eslint-disable-next-line
	}, [editing])

	function onCancel() {
		onClose();
		setData(oldValue);
	}
	function onSubmit() {
		socket.emit('schedule.edit', data, error => {
			if (error) return message.error(error);
			onClose();
			setData(oldValue);
		});
	}
	function addRow(index) {
		let _data = data.slice();
		_data.splice(index+1, 0, { 
			id: Math.floor(Math.random()*10000),
			title: '',
			time: '',
			startsAt: Math.floor((new Date()).getTime()/1000)
		});
		setData(_data);
	}

	return (
		<Modal title="Edit Schedule" visible={editing} onOk={onSubmit} onCancel={onCancel} width={800}>
			<Table dataSource={data ? data : []} locale={{ emptyText: 'Loading/None' }} rowKey="id" pagination={false}>
				<Table.Column title="Countdown Time" dataIndex="startsAt" render={(value, event, index) => <TimePicker format="HH:mm" defaultValue={moment(value*1000)} onSelect={newVal => {
					let _data = data.slice();
					_data[index] = Object.assign({}, data[index], { startsAt: newVal.unix() });
					setData(_data);
				}} allowClear={false} />} width="7rem" />
				<Table.Column title="Time" dataIndex="time" render={(value, event, index) => <Input maxLength={32} value={value} onChange={event => {
					let _data = data.slice();
					_data[index] = Object.assign({}, data[index], { time: event.target.value.slice(0, 32) });
					setData(_data);
				}} />} width="8rem" />
				<Table.Column title="Title" dataIndex="title" render={(value, event, index) => <Input maxLength={256} value={value} onChange={event => {
					let _data = data.slice();
					_data[index] = Object.assign({}, data[index], { title: event.target.value.slice(0, 256) });
					setData(_data);
				}} />} />
				<Table.Column dataIndex="delete" render={(value, event, index) => <Space>
					<Button danger icon={<DeleteOutlined />} onClick={() => {
						let _data = data.slice();
						_data.splice(index, 1);
						setData(_data);	
					}} />
					<Button icon={<PlusOutlined />} onClick={() => addRow(index)} />
				</Space> } width="2rem" />
			</Table>
		</Modal>
	);
};