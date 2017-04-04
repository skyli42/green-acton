var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = require("bluebird");
var url = "mongodb://greenacton:350PPMofCO2@ds157549.mlab.com:57549/green-acton";
var AWS = require('aws-sdk');
var MapboxClient = require('mapbox');
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
var temp = require('temp');

var dataset_id = 'cj05n0i9p0ma631qltnyigi85'; // id for segments
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
app.get('/register', function(req, res) {
    res.sendFile(__dirname + '/assets/registration.html');
})
app.get('/about', function(req, res) {
    res.sendFile(__dirname + '/assets/about.html')
})

var port = process.env.PORT || 3000;

var skey = process.env.MAPBOX_SK;
console.log('Need MAPBOX_SK in environment: ' + skey);
var client = new MapboxClient(skey);

var idSchema = new Schema({
    name: String,
    id: String,
    claimedby: [String]
});
var accSchema = new Schema({
    name: String,
    address: String,
    email: String,
    phone: String,
    groupSize: Number
})
var ID = mongoose.model('id', idSchema);
var Account = mongoose.model('account', accSchema);
mongoose.connect(url).then(function() {
    console.log("connected to mongo database");

    io.on('connection', function(socket) {
        console.log("a user connected!")

        socket.on('registration', function(data) {
            console.log("arrived");
            console.log("name: " + data.name);
            console.log("email address: " + data.emailAddress);
            console.log("phone number: " + data.phoneNumber);
            console.log("group number: " + data.groupNumber);
            var newAcct = new Account({
                name: data.name,
                email: data.email,
                phone: data.phoneNumber,
                groupSize: data.groupNumber
            })
            Account.find({
              email:data.email
            }).select('name').then(function(row, err){
              if(err){
                console.log(err)
              }
              else{

              }
            })
            // newAcct.save(function(err) {
            //     if (err) return console.log(err);
            //     console.log("account saved!")
            // })
        });

        socket.on('sendInfo', function(data) {
            var i;
            for (i in data.featureIds) {
                ID.find({
                    name: data.featureIds[i]
                }).select('id name').then(function(row, err) {
                    if (err) {
                        console.log(err);
                    }
                    client.readFeature(row[0].id, dataset_id, function(err, feature) {
                        if (err) console.log(err);
                        feature.properties.state = parseInt(data.newState);
                        feature.properties.claimedby = data.emailAddress;
                        client.insertFeature(feature, dataset_id, function(err, feature) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('update dataset OK');
                                TileSetNeedsUpdating = true;
                            }
                        })
                    })
                })
            }
        });
    });
})

server.listen(app.listen(port, function() {
    var host = server.address().address;
    var port = server.address().port;
}));

console.log("Listening on port " + port);

const Readable = require('stream').Readable;

var datasetProperties;
var datasetReader = null; // readable stream of dataset features

// for building our geoJSON files
const JSONprolog = '{"type":"FeatureCollection","features":[';
const JSONsep = ',';
const JSONepilog = ']}';
const EnoughExtraChars = 1000; // yes, this is a hack.

class ReadableDataset extends Readable {
    constructor(opt) {
        super(opt);
        this._max = 10;
        this._index = 1;
        this.length = 1e8; //  big max, reduced as we read actual data 
        datasetReader = this;
        this.objectCount = 50;
        this.pagination = null;
        this.featuresRead = 0;
        this.CharsSent = 0;
        //    this.debugbuffer = "";

        client.readDataset(dataset_id,
            function(err, dataset_data) {
                if (err) {
                    console.log('dataset read error: ' + err);
                }
                console.log('dataset data: ' + JSON.stringify(dataset_data));
                datasetProperties = dataset_data;
            });
    }

    //byteLength(){
    //    return datasetProperties.size;
    // }

    _read() {
            var options = {
                limit: datasetReader.objectCount
            }
            if (datasetReader.pagination != null) {
                options.start = datasetReader.pagination;
            }
            console.log(JSON.stringify(options));

            client.listFeatures(dataset_id, options, function(err, featureObject) {
                // Pause the stream to avoid race conditions while pushing in the new objects.
                // Without this, _read() would be called again from inside each push(),
                // resulting in multiple parallel calls to listFeatures

                const wasPaused = datasetReader.isPaused();
                datasetReader.pause();
                console.log('was paused? ' + wasPaused);

                var newChars = 0;

                if (datasetReader.pagination == null) {
                    // just starting: prolog to the JSON
                    datasetReader.push(JSONprolog); // datasetReader.debugbuffer += JSONprolog;
                    newChars += JSONprolog.length;
                }
                var featureCount = featureObject.features.length;
                var featureString = JSON.stringify(featureObject.features).slice(1, -1); //remove square brackets

                //       console.log('feature count: '+ featureCount + ' feature data: ' + featureString);


                if (featureCount != 0) {
                    newChars += featureString.length;
                    datasetReader.CharsSent += newChars;
                    datasetReader.pagination = featureObject.features[featureCount - 1].id;
                    datasetReader.length = datasetReader.CharsSent + EnoughExtraChars; // there's some more - keep calling me back, please
                    datasetReader.push(featureString); // datasetReader.debugbuffer += featureString;
                    datasetReader.featuresRead += featureCount;
                    if (datasetReader.featuresRead != datasetProperties.features) // not the last set of features, so add a seperator
                    {
                        newChars += JSONsep.length;
                        datasetReader.CharsSent += JSONsep.length;
                        datasetReader.length = datasetReader.CharsSent + EnoughExtraChars;
                        datasetReader.push(JSONsep); // datasetReader.debugbuffer += JSONsep;
                    }
                } else { // it's the end of the feature collection
                    newChars += JSONepilog.length;
                    datasetReader.pagination = null;
                    datasetReader.CharsSent += newChars;
                    datasetReader.length = datasetReader.CharsSent;
                    datasetReader.push(JSONepilog); // datasetReader.debugbuffer += JSONepilog;
                    datasetReader.push(null);
                }

                console.log(newChars + ' = newChars ');
                console.log(datasetReader.CharsSent + ' = total chars ');


                if (!wasPaused) {

                    // This will deliver the objects and trigger the next call to _read() once they have been consumed.
                    datasetReader.resume();
                } // end if
            }); // end listFeatures callback
        } // end _read
} // end class

var s3 = null; // will hold Amazon s3 info for updating. 
var credentials = null; // bucket access info



var updateTask = function() {
    console.log('tiles needs update? ' + TileSetNeedsUpdating + ' / update in process? ' + TileSetInProcess);
    if (TileSetNeedsUpdating && !TileSetInProcess) {
        datasetReader = new ReadableDataset();
        TileSetInProcess = true;
        TileSetNeedsUpdating = false; // will get reset to true if another request comes in

        var tempStream = temp.createWriteStream({
            suffix: '.geojson'
        });

        // Automatically track and cleanup files at exit
        temp.track();
        datasetReader.on('end', function() {
            console.log('temp filename : ' + tempStream.path);
            client.createUploadCredentials(function(err, newCredentials) {
                credentials = newCredentials;
                s3 = new AWS.S3({
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                    sessionToken: credentials.sessionToken,
                    region: 'us-east-1'
                });
                console.log('From S3: ' + credentials.accessKeyId);
                var tempfileReadable = fs.createReadStream(tempStream.path);
                console.log(tempfileReadable)
                s3.putObject({
                        Bucket: credentials.bucket,
                        Key: credentials.key,
                        Body: tempfileReadable
                    },
                    function(err, resp) {
                        if (err) {
                            console.log("putObject Error ", err);
                        } else {
                            console.log("putObject Success ", resp);
                            // console.log('preparing to upload ' + datasetReader.debugbuffer.length + '/' + datasetReader.length + ' chars (actual/claimed): ' + datasetReader.debugbuffer);
                            client.createUpload({
                                tileset: username + '.' + tilseset_id,
                                name: tileset_name,
                                url: credentials.url
                            }, function(err, upload) {
                                console.log('create upload: ', err);
                                console.log('create upload: ', upload);
                                var progressMeter = function(id) {
                                        client.readUpload(id, function(err, upload) {
                                            console.log(upload);
                                            if (!upload.complete) {
                                                setTimeout(progressMeter, 30000, upload.id);
                                            } else {
                                                console.log('finished uploading ');
                                                delete datasetReader;
                                                datasetReader = null;
                                                delete s3;
                                                s3 = null;
                                                TileSetInProcess = false;
                                            }
                                        }); // end readUpload
                                    } // end progressMeter
                                progressMeter(upload.id); // kick off progressmeter timer
                            }); // end createUpload
                        } // end 'else'
                    }); // end putObject call
            }); // end createUploadCredentials call
        }); // end writing tempfile
        console.log('stream to tempfile');
        datasetReader.pipe(tempStream);
        console.log('ended call to stream to tempfile');
    } // end if we need to do anything
    setTimeout(updateTask, 30000);
}

// kick off update task
updateTask();