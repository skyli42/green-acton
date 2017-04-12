var socket = io();
socket.on('message', function(msg){
	Materialize.toast(messages.myMessages.properties[msg].msg_string, 4000)
    console.log("message: " + msg + " handler: " + localMessageHandler)
    localMessageHandler && localMessageHandler(msg)
})