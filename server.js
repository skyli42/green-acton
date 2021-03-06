//imports
var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = require("bluebird");
var Promise = require('bluebird')
var AWS = require('aws-sdk');
var MapboxClient = require('mapbox');
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
var temp = require('temp');
var moment = require('moment');
//matched message info for server & clients
var messages = require(__dirname + '/assets/js/messages.js'); // for server use
//global variables
var url = "mongodb://greenacton:350PPMofCO2@ds157549.mlab.com:57549/green-acton";
var dataset_id = 'cj1bf08bs09ba33o7o2smznff'; //new MASS GIS set
// var dataset_id = 'cj15w86wx00w02xovd0koqddm'; //parsed MASS GIS data.
// var dataset_id = 'cj05n0i9p0ma631qltnyigi85'; // id for segments
// var dataset_id = 'cj0tk7a6n04ca2qrx1xaizc6r'; // smaller dataset for testing
// var tileset_name = 'acton-segments';
// var tileset_name = 'acton-segments';
var tileset_name = 'ParsedMassGIS';
var tileset_id = 'cj15w86wx00w02xovd0koqddm-3gm2c'; //parsedMassGIS
var username = "greenacton"
var TileSetNeedsUpdating = false;
var TileSetInProcess = false;
var port = process.env.PORT || 3000;
var skey = process.env.MAPBOX_SK;
var magic = process.env.MAGIC_CLEANUP_ID
// console.log('Need MAPBOX_SK in environment: ' + skey);
var client = new MapboxClient(skey);
//serves webpage
app.use(express.static("./assets"));

app.get('/robots.txt', function (req, res) {
    res.type('text/plain');
    res.send("User-agent: *\nDisallow: /");
});
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/register', function(req, res) {
    res.sendFile(__dirname + '/assets/registration.html');
})
app.get('/reports', function(req, res) {
    res.sendFile(__dirname + '/assets/reports.html');
})
app.get('/map', function(req, res) {
    res.sendFile(__dirname + '/assets/map.html')
})
app.get('/info', function(req, res) {
        res.sendFile(__dirname + '/index.html')
    })
    //Mongoose Schemas
var idSchema = new Schema({
    name: String,
    id: String,
    claimedby: [String]
});
var accSchema = new Schema({
    name: String,
    address: String,
    emailAdd: String,
    phone: String,
    groupSize: Number
})
var ID = mongoose.model('id', idSchema);
var Account = mongoose.model('account', accSchema);
//connecting to database and listening to client
var promiseWhile = function(condition, action) { //helpful function for promises
    var resolver = Promise.defer();
    var loop = function() {
        if (!condition()) return resolver.resolve();
        return Promise.cast(action())
            .then(loop)
            .catch(resolver.reject);
    };
    process.nextTick(loop);
    return resolver.promise;
};
mongoose.connect(url).then(function() {
    console.log("connected to mongo database");
    io.on('connection', function(socket) {
        console.log("a user connected!")
        socket.on('segmentRequest', function(properties){
            key = properties.street + "" + properties.id
        //  console.log("requested key: " + key)
            ID.find({name: key}).select('id').then(function(row, err) {
                if (err) console.log("err" + err);
                client.readFeature(row[0].id, dataset_id, function(err, feature) {
                    if (err) console.log(err);
                    socket.emit('segmentRequestReturn', feature);
                });     
            });
        });
        socket.on('registration', function(data) { //client tries to register
            // console.log('registration init on server')
            var gSize = data.groupSize == '' ? 1 : data.groupSize;
            var newAcct = new Account({
                name: data.name,
                address: data.address,
                emailAdd: data.emailAddress,
                phone: data.phoneNumber,
                groupSize: gSize
            })
            Account.find({
                emailAdd: data.emailAddress
            }).select('name').then(function(row, err) {
                if (err) {
                    console.log(err)
                } else {
                    if (row.length == 0) { //email doesn't already exist
                        newAcct.save(function(err) {
                            if (err) return console.log(err);
                            else {
                                console.log("account saved!")
                                socket.emit('message', messages.myMessages.REG_OK)
                            }
                        })
                    } else {
                        // console.log('email already registered')
                        socket.emit('message', messages.myMessages.REG_ALREADY);
                    }
                }
            })
        });
        socket.on('reportSignin', function(email) {
            details = {};
            details.valid = (email == magic)
            if (details.valid)
            {
                Account.find({}).select('name address emailAdd phone groupSize').then(function(users, err) {
                    if(err){
                        console.log(err);
                        details.valid = false;
                    }else{
                        details.users = users
                    }
                    client.listFeatures(dataset_id, {}, function(err, featureCollection) {
                        details.segmentSummary = featureCollection.features.reduce(function (segmentSummary,feature,i,a) {
                            owner = (feature.properties.claimedby != null) ? feature.properties.claimedby : "unclaimed";
                            if (! segmentSummary[owner])
                            {
                                  segmentSummary[owner] = new Array(0,0,0,0)
                            }
                            segmentSummary[owner][feature.properties.state] = 1 + segmentSummary[owner][feature.properties.state];
                            return segmentSummary;
                        },{});
                        socket.emit('reportSigninReturn',details);          
                    }); 
                });
            }
        });
        socket.on('signin', function(email) {
            Account.find({ //check if email is registered already
                emailAdd: email
            }).select('name email').then(function(row, err) {
                var registered = false;
                if (err) {
                    console.log("err: " + err)
                } else {
                    if (row.length == 0) {
                        registered = false;
                    } else {
                        registered = true;
                    }
                }
                var out = {}
                out.valid = registered;
                out.magic = false;
                if (registered) {
                    out.name = row[0].name;
                } else {
                    out.name = null;
                }
                return Promise.resolve(out);
            }).then(function(out) {
                if (email == magic) {
                    out.magic = true; 
                }
                socket.emit('signInReturn', out);
            })
        })
        socket.on('reqSegAcc', function(email) {
            console.log("request")
            ID.find({
                claimedby: [email]
            }).then(function(row, err) {
                if (err) console.log(err)
                else {
                    var rows = [];
                    var count = 0;
                    promiseWhile(function() {
                        return count < row.length;
                    }, function() {
                        return new Promise(function(resolve, reject) {
                            client.readFeature(row[count].id, dataset_id, function(err, feature) {
                                if (err) console.log(err);
                                // console.log(feature)
                                count++;
                                // a few snuck in with owners for other states. filter those out 
                                if (feature.properties.state == 1){
                                    rows.push(feature);
                                    console.log(feature.properties);
                                }
                                resolve();
                            })
                        });
                    }).then(function() {
                        socket.emit("segmentsAcc", rows);
                    });
                }
            })
        })
        socket.on('deleteSeg', function(segments) {
            var i = 0;
            promiseWhile(function() {
                return i < segments.length;
            }, function() {
                return new Promise(function(resolve, reject) {
                    var curSeg = segments[i];
                    // var constrID = curSeg.properties.name + "" + curSeg.properties.id;
                    console.log(curSeg.id)
                    ID.update({
                        id: curSeg.id
                    }, {
                        claimedby: []
                    }).then(function() {})

                    client.readFeature(curSeg.id, dataset_id, function(err, feature) {
                        if (err) console.log(err);
                        feature.properties.state = 0;
                        feature.properties.claimedby = null;
                        client.insertFeature(feature, dataset_id, function(err, feature) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('update dataset - unclaimed segment');
                                console.log("changed feature: ");
                                console.log(feature.properties);
                                TileSetNeedsUpdating = true;
                            }
                        })
                        i++;
                        resolve();
                    })
                });
            }).then(function() {
                socket.emit('deleteSegSuccess');
            });
        })
        socket.on('sendInfo', function(data) {
            Account.find({ //check if email is registered already
                    emailAdd: data.emailAddress
                }).select('name email').then(function(row, err) {
                    var registered = true;
                    if (err) {
                        console.log("err: " + err)
                    } else {
                        if (row.length == 0) {
                            socket.emit('message', messages.myMessages.NEW_EMAIL);
                            registered = false;
                        }
                    }
                    return Promise.resolve(registered);
                })
                .then(function(registered) { //if email is registered, update selected segments
                    if (registered) {
                        var state = parseInt(data.newState);
                        for (var i in data.featureIds) {
                            ID.find({
                                    name: data.featureIds[i]
                                })
                                .select('id name claimedby').then(function(row, err) {
                                    if (err) console.log("err" + err);
                                    var claimed = false;
                                    console.log("claimed?")
                                    console.log(row)
                                    client.readFeature(row[0].id, dataset_id, function(err, feature) {
                                        if (err) console.log(err);
                                        
                                    //only error state is if the claimer is not the current user & if the new & old states are 'claimed' 
                                    if (state == 1 && feature.properties.state == 1 && row[0].claimedby.length != 0 && row[0].claimedby != data.emailAddress) { 
                                        console.log('claimed')
                                        claimed = true;
                                    }    
                                    if (!claimed) {
                                        var history = "";
                                        if (typeof feature.properties.history == "undefined" || feature.properties.history == null ||feature.properties.length == 0)
                                        {// play catch up synthesize earlier history
                                               history = moment(4, "MM").format() + "," + feature.properties.claimedby +  "," + feature.properties.state + ","
                                               console.log("recreated history: " + history)
                                               feature.properties.history = history;        
                                        }
                                        feature.properties.state = state;
                                        feature.properties.claimedby = data.emailAddress;
                                        var newClaimed = [data.emailAddress]
                                        ID.update({
                                            id: row[0].id
                                        }, {
                                            claimedby: newClaimed
                                        }).then(function() {})
                                        history = history = moment().format() + "," + feature.properties.claimedby +  "," + feature.properties.state + ","
                                        console.log("new history: " + history)
                                        feature.properties.history += history; 
                                        console.log("combined history: " + feature.properties.history)
                                        client.insertFeature(feature, dataset_id, function(err, feature) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                console.log('update dataset because we asked for state to be changed.');
                                                console.log(feature.properties);
                                                TileSetNeedsUpdating = true;
                                            }
                                        })
                                        socket.emit('message', messages.myMessages.SUBMIT_OK)
                                    } else {
                                        socket.emit("message", messages.myMessages.ALREADY_CLAIMED);
                                    }
                                }); // end readFeature
                            });
                        }
                    } else {
                        console.log("Email is not registered, no database work done")
                    }

            });
        });
    });
});
server.listen(app.listen(port, function() {
    var host = server.address().address;
    var port = server.address().port;
}));
console.log("Listening on port " + port);
//updating dataset
const Readable = require('stream').Readable;
var datasetProperties;
var datasetReader = null; // readable stream of dataset features
// for building our geoJSON files
const JSONprolog = '{"type":"FeatureCollection","features":[';
const JSONsep = ',\n';
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
            client.listFeatures(dataset_id, options, function(err, featureCollection) {
                // Pause the stream to avoid race conditions while pushing in the new objects.
                // Without this, _read() would be called again from inside each push(),
                // resulting in multiple parallel calls to listFeatures
                if (err) console.log(err)
                const wasPaused = datasetReader.isPaused();
                datasetReader.pause();
                console.log('was paused? ' + wasPaused);
                var newChars = 0;
                if (datasetReader.pagination == null) {
                    // just starting: prolog to the JSON
                    datasetReader.push(JSONprolog); // datasetReader.debugbuffer += JSONprolog;
                    newChars += JSONprolog.length;
                }
                var featureCount = featureCollection.features.length;
                var featureString = JSON.stringify(featureCollection.features).slice(1, -1); //remove square brackets
                //       console.log('feature count: '+ featureCount + ' feature data: ' + featureString);
                if (featureCount != 0) {
                    newChars += featureString.length;
                    datasetReader.CharsSent += newChars;
                    datasetReader.pagination = featureCollection.features[featureCount - 1].id;
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
var updateTask = function() { //update tileset after modifications
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
                                    tileset: username + '.' + tileset_id,
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
        setTimeout(updateTask, 30000); //Sky: for future reference, setInterval() calls repeatedly a function every X amount of time
                                        // Jim: I did it this way to avoid risk that task would still be running when next task was started.  
    }
    // kick off update task
updateTask();
