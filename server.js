var MongoClient = require('mongodb').MongoClient
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = require("bluebird")
var url = "mongodb://greenacton:350PPMofCO2@ds157549.mlab.com:57549/green-acton";
var AWS = require('aws-sdk');
var MapboxClient = require('mapbox');
var express = require('express')
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var client = new MapboxClient(process.env.MAPBOX_SK);
var dataset_id = 'cj05n0i9p0ma631qltnyigi85'  // id for segments

client.createUploadCredentials(function(err, credentials) {
  // Use aws-sdk to stage the file on Amazon S3
    var s3 = new AWS.S3({
       accessKeyId: credentials.accessKeyId,
       secretAccessKey: credentials.secretAccessKey,
       sessionToken: credentials.sessionToken,
       region: 'us-east-1'});
  });
console.log('From S3: ' + credentials.accessKeyId);

///  s3.putObject({
//    Bucket: credentials.bucket,
//    Key: credentials.key,
//    Body: fs.createReadStream('/path/to/file.mbtiles')
//  }, function(err, resp) {
//  });
// );

app.use(express.static("./assets"));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/register', function(req, res){
    res.sendFile(__dirname+'/assets/html/registration.html');
})

var idSchema = new Schema({
    name: String,
    id: String
});
var ID = mongoose.model('id', idSchema);

mongoose.connect(url).then(function() {
    console.log("connected to mongo database")
  
    io.on('connection', function(socket) {
        console.log("a user connected!")
        socket.on('registration', function(data) {
            console.log("arrived");
            console.log("name: " + data.name);
            console.log("email address: " + data.emailAddress);
            console.log("phone number: " +  data.phoneNumber);
            console.log("group number: " + data.groupNumber);
        });

        socket.on('sendInfo', function(data) {
            //query for mapbox id
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
        });
    });
    // regSocket.on('connection', function(socket){
    //     console.log("s")
    // })
})

var port = process.env.PORT || 3000;

server.listen(app.listen(port, function() {
    var host = server.address().address;
    var port = server.address().port;
}));

console.log("Listening on port " + port)
