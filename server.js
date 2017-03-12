var MongoClient = require('mongodb').MongoClient
var MapboxClient = require('mapbox');
var client = new MapboxClient('pk.eyJ1IjoiZ3JlZW5hY3RvbiIsImEiOiJjaXlobXFxdTYwNXpuMzJvZTkyaHZkY3FnIn0.eTMHeFb7rAlnxU08juWXzQ');

var express = require('express')
var app = express()
app.use(express.static("./assets"));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/map.html');
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
})

client.readFeature('000d146ae23ead63062756703852513a', 'ciyhnerdx05c92wl4wogi3hdg', function (err, feature) {
    if (err) console.log(err);
    console.log(feature);
});
var url = process.env.MONGOLAB_URL; //environment variable

// MongoClient.connect(url, function (err, db) {
//     if (err) throw err
// })