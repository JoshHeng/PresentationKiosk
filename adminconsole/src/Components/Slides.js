import { Table, Image } from 'antd';
import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';
import { MenuOutlined } from '@ant-design/icons';
import styles from './Slides.module.css';

const slides = [
	{
		id: 1,
		src: 'https://www.havenresorts.com/uploads/9/8/7/9/98799368/published/16-9placeholder_59.png',
		title: 'Test'
	},
	{
		id: 2,
		src: 'https://www.clevertech-group.com/assets/img/placeholder/16x9.jpg',
		title: 'Test 2'
	},
]

const DragHandle = sortableHandle(() => <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />);
const SortableItem = sortableElement(props => <tr {...props} />);
const SortableContainer = sortableContainer(props => <tbody {...props} />);

function onSortEnd({ oldIndex, newIndex }) {
	console.log('end');
}

function DraggableContainer(props) {
	return <SortableContainer useDragHandle disableAutoscroll helperClass={styles.rowDragging} onSortEnd={onSortEnd} {...props} />;
}
function DraggableBodyRow(props) {
	const index = slides.findIndex(x => x.index === props['data-row-key']);
	return <SortableItem index={index} {...props} />;
}


export default function Slides() {
	return (
		<Table rowKey="id" dataSource={slides} pagination={false} components={{ body: {
			wrapper: DraggableContainer,
			row: DraggableBodyRow
		}}}>
			<Table.Column title="Sort" dataIndex="sort" width={30} render={() => <DragHandle />} className={styles.dragVisible} />
			<Table.Column title="Slide" dataIndex="src" width="10rem" render={val => <Image src={val} alt="Slide Image" width="10rem" />} className={styles.dragVisible} />
			<Table.Column title="Title" dataIndex="title" key="title" />
			<Table.Column title="ID" dataIndex="id" />
		</Table>
	)
}