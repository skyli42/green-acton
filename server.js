var MongoClient = require('mongodb').MongoClient
var MapboxClient = require('mapbox');
var express = require('express')
var http = require('http');

var app = express()

var server = http.createServer(app);
var io = require('socket.io').listen(server);

var client = new MapboxClient('pk.eyJ1IjoiZ3JlZW5hY3RvbiIsImEiOiJjaXlobXFxdTYwNXpuMzJvZTkyaHZkY3FnIn0.eTMHeFb7rAlnxU08juWXzQ');

app.use(express.static("./assets"));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

	socket.on('sendInfo', function(data){
		console.log("name: " + data.name);
		console.log("email address: " + data.emailAddress);
		console.log("segments: " + data.featureIds);
	});
})

server.listen(app.listen(process.env.PORT || 3000, function() {
	var host = server.address().address;
	var port = server.address().port;
}));


// client.readFeature('000d146ae23ead63062756703852513a', 'ciyhnerdx05c92wl4wogi3hdg', function (err, feature) {
//     if (err) console.log(err);
//     // console.log(feature);
// });
var url = process.env.MONGOLAB_URL; //environment variable
