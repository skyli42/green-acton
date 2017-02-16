const fs = require('fs');
const util = require('util');
const console = require('better-console')
var data = fs.readFileSync("./assets/features.geojson", "utf8");
var obj = JSON.parse(data.toString());
console.log(obj.features[0].geometry.coordinates[0][0]);
// var intersections = 0;
console.log(obj.features.length);
var intersections = new Set();
for(var i=0; i<obj.features.length; i++){ //every street
    // console.log(obj.features[i].geometry.coordinates);
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
                    // console.log(cur+" "+cur2);
                    // intersections.push("("+cur+")");
                    intersections.add(cur);
                    // intersections++;
                }
            }
        }
    }
}
fs.writeFile("./assets/output.txt", util.inspect(intersections), function(err) {
    if(err) 
        return console.log(err);
    console.log("The file was saved!");
});