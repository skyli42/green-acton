var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = require('bluebird')
var url = process.env.MONGOLAB_URL;
var fs = require('fs');
// var Segment = require('./segment');
var data = JSON.parse(fs.readFileSync('./segments_new.json', 'utf8').toString()).features;

// var segmentSchema = new Schema({
//     type: {type:String},
//     properties:{
//         start: String,
//         end: String,
//         street: String,
//         id: Number,
//         state: Number,
//         claimedby: String
//     },
//     geometry:{
//         coordinates: [[Number, Number]],
//         type: {type:String}
//     }
// });
var idSchema = new Schema({
    name: String,
    id: String
});
var ID= mongoose.model('id', idSchema);
mongoose.connect(url).then(function(){
    console.log('Connected to mongo server.');
    console.log(data.length)
    for (var i = 0; i < data.length; i++) {
        var name = data[i].properties.street+""+data[i].properties.id;
        var id = data[i].id;
        var out = new ID({name:name, id:id});
        // console.log(out)
    //     var segModel = new Segment(data[i]);
        out.save(function (err) {
            if (err) return console.log(err);
        })
    }
});

// mongoose.connection.on('open', function (ref) {
    
// })