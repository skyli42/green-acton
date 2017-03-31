mapboxgl.accessToken = 'pk.eyJ1IjoiZ3JlZW5hY3RvbiIsImEiOiJjaXlobXFxdTYwNXpuMzJvZTkyaHZkY3FnIn0.eTMHeFb7rAlnxU08juWXzQ';


var socket = io.connect();

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/greenacton/ciyhnkn57002n2ro46orppg16',
    center: [-71.432, 42.482],
    zoom: 12,
    maxBounds: [
        [-71.5, 42.429],
        [-71.375, 42.54]
    ],
});
// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());
// Add geolocate control to the map.
map.addControl(new mapboxgl.GeolocateControl());
// disable map rotation using right click + drag
map.dragRotate.disable();
// disable map rotation using touch rotation gesture
map.touchZoomRotate.disableRotation();
// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup(
    {closeButton: false, offset: 25, closeOnClick: true});

var curFeatureIds = [];
var CurFeatures = [];

function feature_description(feature) {
  return  feature.properties.street 
                + ' between ' 
                + ((feature.properties.start == null) 
                    ? 'end of the road' : feature.properties.start) 
                + ' and ' 
                + ((feature.properties.end == null) 
                    ? 'end of the road' : feature.properties.end);
}

var stateMap =[];  // first steps in improving colors of selected objects

map.on('mousemove', function(e) {
    var bbox = [
        [e.point.x - 8, e.point.y - 8],
        [e.point.x + 8, e.point.y + 8]
    ];
    var features = map.queryRenderedFeatures(bbox, {
        layers: ['acton-segments']
    });
    
    // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = features.length ? 'pointer' : '';  
    if (features.length) {  
        var feature = features[0];
        var location 
             = feature.geometry.coordinates[Math.floor(feature.geometry.coordinates.length / 2)];
            popup.setLngLat(location)
            .setText(feature_description(feature))
            .addTo(map);
    }
});
map.on('click', function(e) {
    // set bbox as 8px rectangle area around clicked point
    var bbox = [
        [e.point.x - 8, e.point.y - 8],
        [e.point.x + 8, e.point.y + 8]
    ];
    var features = map.queryRenderedFeatures(bbox, {
        layers: ['acton-segments']
    });
    
     
    for (var i = 0; i < features.length; i++) {
        console.log(features[i])
        var idToSend = features[i].properties.street + "" + features[i].properties.id; 
        var alreadySelected = curFeatureIds.indexOf(idToSend);
        console.log("selected index is " + alreadySelected);
        if (alreadySelected == -1){
            // not already selected - select it
            curFeatureIds.push(idToSend);
            CurFeatures.push(features[i]);
            console.log("will select" + idToSend);
            map.addLayer({
                'id': idToSend,
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
            } else{ 
            console.log("will deselect " + idToSend); 
            curFeatureIds.splice( alreadySelected, 1 ); 
            CurFeatures.splice ( alreadySelected, 1);  
            map.removeLayer(idToSend);  
            map.removeSource(idToSend);               
        }
     }
     $('#selected').empty();
     for (var j = 0; j < CurFeatures.length; j++) {
        $('#selected').append("<li>"+feature_description(CurFeatures[j])+"</li><br>")
     }
});


$('#slide-out').submit(function(event) {
    event.preventDefault();
    var emailInput = $('#emailInput').val();
    var stateInput =  $( "input:checked" ).val();
    
    if (!isValidEmail(emailInput)) {
        $('#submitted').empty();
        $('#segments').empty();
        $('#invalidEmail').html("invalid email address");
    } else {
        socket.emit('sendInfo', {
            emailAddress: emailInput,
            newState: stateInput,
            featureIds: curFeatureIds
        });
        
        $('#invalidEmail').empty();
        $('#submitted').html("Thanks for updating these streets");
        return false;
    }
    return false;
});

function isValidEmail(emailAddress) {
    var regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regEx.test(emailAddress);
}
