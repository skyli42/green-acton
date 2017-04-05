var socket = io();
socket.on('message', function(msg){
	Materialize.toast(msg, 4000)
})