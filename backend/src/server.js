/**
 * Creates the server
 *
 */

const app = require('express')();
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST'],
	},
});

module.exports = { io, httpServer };