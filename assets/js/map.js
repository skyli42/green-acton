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
//a scale
map.addControl(new mapboxgl.ScaleControl({unit: 'imperial'}));

// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup(
    {closeButton: false, offset: 25, closeOnClick: true});

var curFeatureIds = [];
var CurFeatures = [];

const bodyHeight = $('body').height()

function feature_description(feature) {
  return  feature.properties.street 
                + ' between ' 
                + ((feature.properties.start == null) 
                    ? 'end of the road' : feature.properties.start) 
                + ' and ' 
                + ((feature.properties.end == null) 
                    ? 'end of the road' : feature.properties.end);
}

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

var colorMap =[{rgb:'rgb(238,23,23)'},{rgb:'rgb(22,87,218)'},{rgb:'rgb(0,255,43)'}];  

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
                    'line-color': colorMap[parseInt($( "input:checked" ).val())].rgb,
                    'line-opacity': 0.35,
                    'line-width': 12
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
    if (CurFeatures != 0) {
        $('#clear').removeClass('disabled')
    }
    if(!hasMaxedSegments()) {
        for (var i = 0; i < CurFeatures.length && !hasMaxedSegments(); i++) {
            $('#selected').append("<li>"+feature_description(CurFeatures[i])+"</li><br>")
        }
    }
    if (hasMaxedSegments()) {
        $('#selected').append("and more")
    }
});

function HandleStateChange()
{
    var stateInput =  parseInt($( "input:checked" ).val());
    var newColor = colorMap[stateInput].rgb;
    
    console.log('new state/color ' + stateInput + '/' + newColor);  
   
    curFeatureIds.forEach(function(element) {
        // console.log(element);
        map.setPaintProperty(element, 'line-color', newColor);
    });
}

$('#stateInput0').change(function(event){HandleStateChange();});
$('#stateInput1').change(function(event){HandleStateChange();});
$('#stateInput2').change(function(event){HandleStateChange();});

$('#clear').trigger(function(event) {
    $('#segments').empty()
    event.preventDefault()
})

$('#mapform').submit(function(event) {
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

function hasMaxedSegments() {
    var divHeight = $('#segments').innerHeight()
    return divHeight >= bodyHeight / 3.2
}