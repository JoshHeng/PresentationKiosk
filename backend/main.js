require('dotenv').config();

const app = require("express")();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST']
	}
});

io.on("connection", socket => { /* ... */ });

io.on("connection", socket => {
	console.log('Connection Established');

	socket.once('disconnect', () => {
		console.log('Connection Disconnected');
	})
});

httpServer.listen(3001, () => {
	console.log('Backend Listening');
});