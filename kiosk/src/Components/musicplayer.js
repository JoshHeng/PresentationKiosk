import socket from '../socket';

var cachedTrack, currentTrack;
var volume = 0.8;

socket.on('music.load', (url, callback = null) => {
	cachedTrack = new Audio(url)
	if (callback) callback();
});

socket.on('music.play', (startPaused, callback = null) => {
	if (currentTrack) currentTrack.pause();

	currentTrack = cachedTrack;
	cachedTrack = null;

	currentTrack.volume = volume;
	currentTrack.onerror = () => socket.emit('music.ended');
	currentTrack.onended = () => socket.emit('music.ended');
	if (!startPaused) currentTrack.play();

	if (callback) callback();
});
socket.on('music.pause', () => currentTrack.pause());
socket.on('music.resume', () => currentTrack.play());
socket.on('music.volume', (vol, callback = null) => {
	volume = vol;
	if (currentTrack) currentTrack.volume = vol;

	if (callback) callback();
});