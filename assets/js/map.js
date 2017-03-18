mapboxgl.accessToken = 'pk.eyJ1IjoiZ3JlZW5hY3RvbiIsImEiOiJjaXlobXFxdTYwNXpuMzJvZTkyaHZkY3FnIn0.eTMHeFb7rAlnxU08juWXzQ';

var socket = io.connect("http://localhost:3000");

// socket.on('click', function(){
//        console.log("click from server")
// })

// var tileset = 'acton-streets';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/greenacton/ciyhnkn57002n2ro46orppg16',
    center: [-71.432, 42.482],
    zoom: 13,
    maxBounds: [
        [-71.5, 42.429],
        [-71.375, 42.54]
    ],
});

// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup({
    closeButton: false
});

var curFeatureIds = [];
var curStreetNames = [];

map.on('mousemove', function(e) {
    var bbox = [
        [e.point.x - 8, e.point.y - 8],
        [e.point.x + 8, e.point.y + 8]
    ];
    var features = map.queryRenderedFeatures(bbox, {
        layers: ['acton-segments']
    });

    if (features.length) {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = features.length ? 'pointer' : '';


        var feature = features[0];
        // Populate the popup and set its text
        // based on the feature found. Put it in the middle of the road's coordinates
        popup.setLngLat(feature.geometry.coordinates[Math.floor(feature.geometry.coordinates.length / 2)])
            .setText(feature.properties.street + ' between ' +
                ((feature.properties.start == null) ? 'end of the road' : feature.properties.start) + ' and ' +
                ((feature.properties.end == null) ? 'end of the road' : feature.properties.end))
            .addTo(map);
    }
});

map.on('click', function(e) {
    // set bbox as 8px reactangle area around clicked point
    var bbox = [
        [e.point.x - 8, e.point.y - 8],
        [e.point.x + 8, e.point.y + 8]
    ];
    var features = map.queryRenderedFeatures(bbox, {
        layers: ['acton-segments']
    });


    //socket.emit('sendFeatures', {features});
    for (var i = 0; i < features.length; i++) {
        console.log(features[i])
        var idToSend = features[i].properties.street + "" + features[i].properties.id; //[streetname][#]
        // if(!curFeatureIds.includes(features[i].id)){
        //     curFeatureIds.push(features[i].id);
        //     curStreetNames.push(features[i]);
        if (!curFeatureIds.includes(idToSend)) {
            curFeatureIds.push(idToSend);
            curStreetNames.push(features[i]);
            map.addLayer({
                'id': 'segment-' + curStreetNames.length,
                'type': 'line',
                'source': {
                    'type': 'geojson',
                    'data': features[i]
                },
                'layout': {},
                'paint': {
                    'line-color': '#222',
                    'line-opacity': 0.35,
                    'line-width': 10
                }
            });
        }
    }

    // console.log(features);
    // console.log(features[0].id);

    // Run through the selected features and set a filter
    // to match features with unique FIPS codes to activate
    // the `counties-highlighted` layer.
    // var filter = features.reduce(function(memo, feature) {
    //     memo.push(feature.properties.FIPS);
    //     return memo;
    // }, ['in', 'FIPS']);

    // map.setFilter("counties-highlighted", filter);

    // for(var i = 0; i < curStreetNames.length; i++) {
    // console.log(curStreetNames[i]);
    // }
});

$('#form').submit(function(event) {
    var nameInput = $('#nameInput').val();
    var emailInput = $('#emailInput').val();

    if (nameInput == "") {
        $('#invalidEmail').empty();
        $('#submitted').empty();
        $('#segments').empty();
        $('#invalidName').html("Please enter a name.");
    } else if (!isValidEmail(emailInput)) {
        $('#invalidName').empty();
        $('#submitted').empty();
        $('#segments').empty();
        $('#invalidEmail').html("invalid email address");
    } else {
        socket.emit('sendInfo', {
            name: nameInput,
            emailAddress: emailInput,
            featureIds: curFeatureIds
        });
        $('#invalidName').empty();
        $('#invalidEmail').empty();
        $('#submitted').html("Thanks for signing up!");
        $('#segments').html('your current street segments:<br>');
        for (var i = 0; i < curFeatureIds.length; i++) {
            $('#segments').append(curFeatureIds[i] + '<br>');
        }
    }
    event.preventDefault();
})

function isValidEmail(emailAddress) {
    var regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regEx.test(emailAddress);
}