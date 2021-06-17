import { useEffect, useState } from 'react';
import { Button, Card, Table } from 'antd';
import socket from '../socket';
import EditableSchedule from './EditableSchedule';

export default function Schedule() {
	const [ data, setData ] = useState(null);
	const [ editing, setEditing ] = useState(false);

	useEffect(() => {
		socket.on('schedule.set', _data => setData(_data));
		socket.emit('schedule.request');

		return () => socket.off('schedule.set');
	}, []);

	return (
		<Card title="Schedule" bordered={false}>
			<div style={{ display: 'flex'}}>
				<Button style={{ marginRight: '1rem' }} onClick={() => socket.emit('schedule.toggleCountdown')}>{ data && data.showCountdown ? 'Hide' : 'Show' } Time Remaining</Button>
				<Button style={{ marginRight: '0.2rem' }} disabled={data && !data.currentEventIndex} onClick={() => socket.emit('schedule.previous')}>Previous Event</Button>
				<Button type="primary" disabled={data && data.currentEventIndex + 1 >= data.events.length} onClick={() => socket.emit('schedule.next')}>Next Event</Button>
				<Button style={{ marginLeft: 'auto' }} onClick={() => setEditing(true)}>Edit</Button>
			</div>

			<h4 style={{ marginTop: '1rem' }}>Events</h4>
			<Table dataSource={data && data.events ? data.events : []} locale={{ emptyText: 'Loading/None' }} rowKey="id" pagination={false} rowClassName={(event, index) => data.currentEventIndex === index ? 'current-row' : ''}>
				<Table.Column title="Countdown Time" dataIndex="startsAt" render={val => (new Date(val*1000).toLocaleTimeString())} />
				<Table.Column title="Time" dataIndex="time" />
				<Table.Column title="Title" dataIndex="title" />
			</Table>

			<EditableSchedule editing={editing} onClose={() => setEditing(false)} oldValue={data && data.events} />
		</Card>
	);
}
