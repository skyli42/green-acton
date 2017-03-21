var MongoClient = require('mongodb').MongoClient
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = require("bluebird")
    // var url = process.env.MONGOLAB_URL; //url (will be set on heroku, needs to be set on desktop systems)
var url = "mongodb://greenacton:350PPMofCO2@ds157549.mlab.com:57549/green-acton";
var MapboxClient = require('mapbox');
var express = require('express')
var http = require('http');

var app = express()

var server = http.createServer(app);
var io = require('socket.io').listen(server);

// sk... can access dataset write
var client = new MapboxClient('sk.eyJ1IjoiZ3JlZW5hY3RvbiIsImEiOiJjaXpiaGkyM3cwcGY1MnhxcHhhZjlpeTZiIn0.cL48iVWM8qYJG6rroRBrow');
var dataset_id = 'cj05n0i9p0ma631qltnyigi85'  // id for segments

app.use(express.static("./assets"));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

var idSchema = new Schema({
    name: String,
    id: String
});
var ID = mongoose.model('id', idSchema);

mongoose.connect(url).then(function() {
    console.log("connected to mongo database")
  
    io.on('connection', function(socket) {
        socket.on('registration', function(data) {
            console.log("arrived");
            console.log("name: " + data.name);
            console.log("email address: " + data.emailAddress);
            console.log("phone number: " +  data.phoneNumber);
            console.log("group number: " + data.groupNumber);
        });

        socket.on('sendInfo', function(data) {

            query for mapbox id
            for(var i in data.featureIds){
                ID.find({name:data.featureIds[i]}).select('id name').then(function(row, err){
                    
                    if(err)console.log(err);
                    client.readFeature(row[0].id, dataset_id, function(err, feature) {
                        if (err) console.log(err);
                        feature.properties.state = data.newState;
                        feature.properties.claimedby = data.emailAddress;
                        client.insertFeature(feature, dataset_id, function(err, feature) {
                            if (err) console.log(err);
                            console.log(feature.properties);
                        })
                    })
                })
            }
            console.log("name: " + data.name);
            console.log("email address: " + data.emailAddress);
            console.log("segments: " + data.featureIds);


            // step 1: verify we can do dataset writes in backend 
            // 1A) get a feature to work with
            client.readFeature('cff800c8b0ddafc54950d67776cf8153', 'cj05n0i9p0ma631qltnyigi85', function(err, feature) {
                if (err) console.log(err);
                console.log("feature id: " + feature.id);
                console.log("current state: " + feature.properties.state);
                // 1B) make a change
                feature.properties.state = (1 + feature.properties.state) % 3; //increment & wrap
                console.log("proposed state: " + feature.properties.state);
                // 1C) write it back
                client.insertFeature(feature, 'cj05n0i9p0ma631qltnyigi85', function(err, feature) {
                    if (err) console.log(err);
                });
            });
        });



    });

})

server.listen(app.listen(process.env.PORT || 3000, function() {
    var host = server.address().address;
    var port = server.address().port;
}));

console.log("Listening on port 3000")

// client.readFeature('000d146ae23ead63062756703852513a', 'ciyhnerdx05c92wl4wogi3hdg', function (err, feature) {
//     if (err) console.log(err);
//     // console.log(feature);
// });
// var url = process.env.MONGOLAB_URL; //environment variable
