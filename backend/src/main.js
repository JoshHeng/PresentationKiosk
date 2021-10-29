require('dotenv').config();

const { httpServer } = require('./server');
require('./socket');

httpServer.listen(3001, () => {
	console.log('Backend Listening');
});