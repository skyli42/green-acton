var socket = io();
socket.on('message', function(msg){
	console.log('ii')
	Materialize.toast(msg, 4000)
})