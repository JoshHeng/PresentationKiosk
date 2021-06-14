import socketIOClient from 'socket.io-client';
const socket = socketIOClient(process.env.REACT_APP_SOCKET_URL, { path: process.env.REACT_APP_SOCKET_PATH || '/socket.io' });
export default socket;