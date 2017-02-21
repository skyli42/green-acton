const fs = require('fs');
const util = require('util');
const console = require('better-console')
var SortedSet = require("collections/sorted-set");

var data = fs.readFileSync("./assets/features.geojson", "utf8");
var obj = JSON.parse(data.toString());

var intersections = new Set();
var arr = new Set();

var nint = 0;
for(var i=0; i<obj.features.length; i++){ //every street
    var coordArr = obj.features[i].geometry.coordinates;
    for(var j = 0; j<coordArr.length; j++){ //each coordinate
        //check if it matches with other coordinates
        var cur = coordArr[j];
        for(var k=0; k<obj.features.length; k++){
            if(k == i) //same street
                continue;
            var coordArr2 = obj.features[k].geometry.coordinates;
           
            for(var l = 0; l<coordArr2.length; l++){
                var cur2 = coordArr2[l];
                if(cur[0]===cur2[0]&&cur[1]===cur2[1]){
                    var insc= {};
                    insc.coordinates = cur;
                    insc.street1 = obj.features[i].properties.name;
                    insc.street2 = obj.features[k].properties.name;
                    if(obj.features[i].properties.name===obj.features[k].properties.name){
                        arr.add(insc);
                    }
                    intersections.add(insc);
                    nint++;
                }
            }
        }
    }
}
console.log(obj.features.length);
console.log(arr.size);
var sorted = arr.sorted(function(a, b){
    return a.street1.localeCompare(b.street2);
});
var sortInt = intersections.sorted(function(a, b){
        if(a.street1!==b.street1)
            return a.street1.localeCompare(b.street1);
        else
            return a.street2.localeCompare(b.street2);
});
fs.writeFile("./assets/output.txt", util.inspect(sortInt, {depth: null, maxArrayLength: null}), function(err) {
    if(err) 
        return console.log(err);
    console.log("The file was saved!");
});
fs.writeFile("./assets/output2.txt", util.inspect(sorted, {depth: null, maxArrayLength: null}), function(err) {
    if(err) 
        return console.log(err);
    console.log("The file was saved!");
});