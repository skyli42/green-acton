mapboxgl.accessToken = 'pk.eyJ1IjoiZ3JlZW5hY3RvbiIsImEiOiJjaXlobXFxdTYwNXpuMzJvZTkyaHZkY3FnIn0.eTMHeFb7rAlnxU08juWXzQ';

var socket = io.connect("http://localhost:3000");

socket.on('click', function(){
        console.log("click from server")
})

var tileset = 'acton-streets';

var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/greenacton/ciyhnkn57002n2ro46orppg16',
        center: [-71.432, 42.482],
        zoom: 13,
        maxBounds: [[-71.5, 42.429], [-71.375, 42.54]],
});

var curFeatureIds = [];
var curStreetNames = [];

map.on('click', function(e) {
        // set bbox as 5px reactangle area around clicked point
        var bbox = [[e.point.x - 5, e.point.y - 5], [e.point.x + 5, e.point.y + 5]];
        var features = map.queryRenderedFeatures(bbox, {layers:['acton-segments']});
        
        //socket.emit('sendFeatures', {features});
        for (var i = 0; i < features.length; i++){
                curFeatureIds.push(features[i].id);
                curStreetNames.push(features[i]);
        }

	//console.log(features);

        // Run through the selected features and set a filter
        // to match features with unique FIPS codes to activate
        // the `counties-highlighted` layer.
        // var filter = features.reduce(function(memo, feature) {
        //     memo.push(feature.properties.FIPS);
        //     return memo;
        // }, ['in', 'FIPS']);

        // map.setFilter("counties-highlighted", filter);

        for(var i = 0; i < curStreetNames.length; i++) {
        console.log(curStreetNames[i]);
}
});

$('#form').submit(function(event){  
        var nameInput = $('#nameInput').val();
        var emailInput = $('#emailInput').val();
        
        if (nameInput == "") {
                $('#invalidEmail').empty();
                $('#submitted').empty();
                $('#segments').empty();
                $('#invalidName').html("Please enter a name.");
        }
        else if (!isValidEmail(emailInput)) {
                $('#invalidName').empty();
                $('#submitted').empty();
                $('#segments').empty();
                $('#invalidEmail').html("invalid email address");    
        }
        else {
                socket.emit('sendInfo', {name: nameInput, emailAddress: emailInput, featureIds: curFeatureIds});
                $('#invalidName').empty();
                $('#invalidEmail').empty();
                $('#submitted').html("Thanks for signing up!");
                $('#segments').html('your current street segments:<br>');
                for(var i = 0; i < curFeatureIds.length; i++) {
                        $('#segments').append(curFeatureIds[i] + '<br>');
                }
        }
        event.preventDefault();
})

function isValidEmail(emailAddress)   
{ 
    var regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regEx.test(emailAddress);
}  