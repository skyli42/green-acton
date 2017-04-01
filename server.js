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
var fs   = require('fs');

var dataset_id = 'cj05n0i9p0ma631qltnyigi85';  // id for segments
// var dataset_id = 'cj0tk7a6n04ca2qrx1xaizc6r'; // smaller dataset for testing
// var tileset_name = 'acton-segments';
var tileset_name = 'acton-segments';
var tilseset_id = 'cj05n0i9p0ma631qltnyigi85-1bg4y';
var username = "greenacton"

var TileSetNeedsUpdating = false;
var TileSetInProcess = false;

app.use(express.static("./assets"));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/register', function(req, res){
    res.sendFile(__dirname+'/assets/registration.html');
})
app.get('/about', function(req, res){
  res.sendFile(__dirname+'/assets/about.html')
})

var port = process.env.PORT || 3000;

var skey = process.env.MAPBOX_SK
console.log('Need MAPBOX_SK in environment: ' + skey);
var client = new MapboxClient(skey);

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
            console.log("name: " + data.name);
            console.log("email address: " + data.emailAddress);
            console.log("phone number: " +  data.phoneNumber);
            console.log("group number: " + data.groupNumber);
        });

        socket.on('sendInfo', function(data) {
            var someChanged = false;
            for(var i in data.featureIds){
                ID.find({name:data.featureIds[i]}).select('id name').then(function(row, err){
                    if(err)console.log(err);
                    client.readFeature(row[0].id, dataset_id, function(err, feature) {
                        if (err) console.log(err);
                        feature.properties.state = data.newState;
                        feature.properties.claimedby = data.emailAddress;
                        client.insertFeature(feature, dataset_id, function(err, feature) {
                            if (err) {
                                console.log(err);
                            } else {
                            console.log('update dataset OK');
                            someChanged =true;
                            }
                        })
                    })
                })
            }
            if (someChanged) TileSetNeedsUpdating= true;
        });
    });
})

server.listen(app.listen(port, function() {
    var host = server.address().address;
    var port = server.address().port;
}));

console.log("Listening on port " + port)



const Readable = require('stream').Readable;

var datasetProperties;

class ReadableDataset extends Readable {
  constructor(opt) {
    super(opt);
    this._max = 10;
    this._index = 1;
    this.length = 11;    //we need to more work to set this value propely
    client.readDataset(dataset_id,
    function(err, dataset_data) {
        if (err) {console.log('dataset read error: ' + err );}
        console.log('dataset data: ' + JSON.stringify(dataset_data) );

        datasetProperties = dataset_data;
  });
  }
 
 byteLength(){
    return datasetProperties.size;
 }
  
  _read() {
    console.log('in_read');
    var i = this._index++;
    if (i > this._max) {
      console.log('_read is done ');
      this.push(null);
    }
    else {
      var str = '' + i;
      console.log('_read str is ' + str);
      var buf = Buffer.from(str, 'ascii');
      this.push(buf);
    }
  }
}

var s3 = null;   // will hold Amamzon s3 info for updating. 


client.createUploadCredentials(function(err, credentials) {
  // Use aws-sdk to stage the file on Amazon S3
    s3 = new AWS.S3({
       accessKeyId: credentials.accessKeyId,
       secretAccessKey: credentials.secretAccessKey,
       sessionToken: credentials.sessionToken,
       region: 'us-east-1'});
    console.log('From S3: ' + credentials.accessKeyId);
 });
 
 var updateTask = function () {
    console.log("updateTask");
    setTimeout(updateTask,30000);
}
updateTask();
 
 
//    var datasetReader = new ReadableDataset();
//    
//    s3.putObject({
//    Bucket: credentials.bucket,
//    Key: credentials.key,
//   Body: datasetReader
//  }, function(err, resp) {
//        if (err) {
//           console.log("Error ", err);
//        } 
//        if (resp) {
//            console.log("Upload Success ", resp);
//       }   
//     });
//});
