import socket from '../socket';

var cachedTrack, currentTrack;
var volume = 0.1;
var status = 0; //1 - fade out, 2 = fade in

function fadeIn() {
	if (!currentTrack || currentTrack.volume >= volume || status !== 2) {
		if (status === 2) status = 0;
		return;
	}

	currentTrack.volume = Math.min(currentTrack.volume + 0.01, volume);
	setTimeout(fadeIn, 200);
}
function fadeOut() {
	if (!currentTrack || currentTrack.volume <= 0 || status !== 1) {
		if (status === 1) {
			status = 0;
			if (currentTrack) currentTrack.pause();
		}
		return;
	}
	
	currentTrack.volume = Math.max(currentTrack.volume - 0.01, 0);
	setTimeout(fadeOut, 200);
}

socket.on('music.load', (url, callback = null) => {
	cachedTrack = new Audio(url)
	if (callback) callback();
});

socket.on('music.play', (startPaused, callback = null) => {
	if (currentTrack) currentTrack.pause();
	status = 0;

	currentTrack = cachedTrack;
	cachedTrack = null;

	currentTrack.volume = volume;
	currentTrack.onerror = () => socket.emit('music.ended');
	currentTrack.onended = () => socket.emit('music.ended');
	if (!startPaused) currentTrack.play();

	if (callback) callback();
});
socket.on('music.pause', () => {
	if (currentTrack) {
		status = 1;
		fadeOut();
	}
});
socket.on('music.resume', () => {
	if (currentTrack) {
		currentTrack.volume = 0;
		status = 2;
		fadeIn();
		currentTrack.play()
	}
});
socket.on('music.volume', (vol, callback = null) => {
	volume = vol/5;
	if (currentTrack) currentTrack.volume = vol/5;

	if (callback) callback();
});