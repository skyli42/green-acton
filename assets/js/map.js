mapboxgl.accessToken = 'pk.eyJ1IjoiZ3JlZW5hY3RvbiIsImEiOiJjaXlobXFxdTYwNXpuMzJvZTkyaHZkY3FnIn0.eTMHeFb7rAlnxU08juWXzQ';
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
map.addControl(new mapboxgl.ScaleControl({
    unit: 'imperial'
}));

// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup({
    closeButton: false,
    offset: 25,
    closeOnClick: true
});

var curFeatureIds = [];
var curFeatures = [];

var noSegmentsMessage;

$(function() {
    noSegmentsMessage = $('#selected').html();
    noCurSegmentsMsg = $('#selectedStreets').html();
});

const BODY_HEIGHT = $('body').height()

const LINE_WIDTH_THIN = 7.24
const LINE_WIDTH_WIDE = 12

function feature_description(feature) {
    return feature.properties.street == "" ? "UNNAMED STREET" : feature.properties.street + ' between ' + ((feature.properties.start == null) ? 'end of the road' : feature.properties.start == "" ? "UNNAMED STREET" : feature.properties.start) + ' and ' + ((feature.properties.end == null) ? 'end of the road' : feature.properties.end == "" ? "UNNAMED STREET" : feature.properties.end);
}

function clearSegmentList() {
    $('#selected').html("")
    $('#selected').append(noSegmentsMessage);
    $('selectedStreets').append(noCurSegmentsMsg)
    $('#clear').addClass('disabled')
    $('#submit').addClass('disabled')
    curFeatureIds = [];
    curFeatures = [];
}

function localMessageHandler(msg) {
    switch (msg) {
        case messages.myMessages.NEW_EMAIL:
            $('#submitted').html('Unrecognized Email. Correct it or <a href="register">register this email here</a>');
            break;
        case messages.myMessages.SUBMIT_OK:
            for (var i = 0; i < curFeatureIds.length; i++) {
                map.setPaintProperty(curFeatureIds[i], 'line-width', LINE_WIDTH_THIN);
            }
            clearSegmentList();
            break;
    }
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
        var location = feature.geometry.coordinates[Math.floor(feature.geometry.coordinates.length / 2)];
        popup.setLngLat(location)
            .setText(feature_description(feature))
            .addTo(map);
    }
});

var colorMap = [{
    rgb: 'rgb(238,23,23)'
}, {
    rgb: 'rgb(22,87,218)'
}, {
    rgb: 'rgb(0,255,43)'
}];


map.on('click', function(e) {
    // set bbox as 5px rectangle area around clicked point
    var bbox = [
        [e.point.x - 5, e.point.y - 5],
        [e.point.x + 5, e.point.y + 5]
    ];
    var features = map.queryRenderedFeatures(bbox, {
        layers: ['acton-segments']
    });
    var selectedFeature;
    if (features.length == 0) clearSegments();

    for (var i = 0; i < features.length; i++) {
        console.log(features[i])
        var idToSend = features[i].properties.street + "" + features[i].properties.id;
        var alreadySelected = curFeatureIds.indexOf(idToSend);
        console.log("selected index is " + alreadySelected);
        if (alreadySelected == -1) {
            // not already selected - select it
            curFeatureIds.push(idToSend);
            curFeatures.push(features[i]);
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
                    'line-color': colorMap[parseInt($("input:checked").val())].rgb,
                    'line-opacity': 0.35,
                    'line-width': LINE_WIDTH_WIDE
                }
            });
        } else {
            console.log("will deselect " + idToSend);
            curFeatureIds.splice(alreadySelected, 1);
            curFeatures.splice(alreadySelected, 1);
            map.removeLayer(idToSend);
            map.removeSource(idToSend);
        }
    }

    $('#selected').empty();
    if (curFeatures.length != 0) {
        $('#clear').removeClass('disabled')
        $('#submit').removeClass('disabled')
        $('#invalidEmail').empty();
    } else {
        clearSegmentList();
    }
    if (!hasMaxedSegments()) { //TODO: Change to scrolling
        for (var i = 0; i < curFeatures.length && !hasMaxedSegments(); i++) {
            console.log("append")
            $('#temp').remove()
            $('#selected').append("<li>" + feature_description(curFeatures[i]) + "</li>")
        }
    }
    if (hasMaxedSegments()) {
        $('#selected').append("and more")
    }
});

map.on('drag', function(event) {
    if (screen.width < 480) {
        $('body').css("overflow", "hidden")
        $('body').css("height", "100%")
    }
})

map.on('dragend', function(event) {
    if (screen.width < 480) {
        $('body').css("overflow", "scroll")
    }
})

function isValidEmail(emailAddress) {
    var regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regEx.test(emailAddress);
}

function hasMaxedSegments() {
    var divHeight = $('#segments').innerHeight()
    return divHeight >= BODY_HEIGHT / 4
}

function HandleStateChange() {
    var stateInput = parseInt($("input:checked").val());
    var newColor = colorMap[stateInput].rgb;

    // console.log('new state/color ' + stateInput + '/' + newColor);  

    curFeatureIds.forEach(function(element) {
        // console.log(element);
        map.setPaintProperty(element, 'line-color', newColor);
    });
}

$('#stateInput0').change(function(event) {
    HandleStateChange();
});
$('#stateInput1').change(function(event) {
    HandleStateChange();
});
$('#stateInput2').change(function(event) {
    HandleStateChange();
});

function clearSegments() {
    for (var i = 0; i < curFeatureIds.length; i++) {
        map.removeLayer(curFeatureIds[i]);
        map.removeSource(curFeatureIds[i]);
    }
    clearSegmentList();
}

$('#clear').click(function(event) {
    clearSegments();
});

function signIn(name) {
    $('#signIn').addClass('hide')
    $('#welcome').removeClass('hide')
    $('#name').html(name)
    $('#tabs').removeClass('hide')
    $('#mapform').removeClass('hide')
    $('#curSegments').removeClass('hide')
    $('#signOut').removeClass('hide')
    $('#deleteSeg').removeClass('hide');
}

function signOut() {
    $('#signIn').removeClass('hide')
    $('#welcome').addClass('hide')
    $("#name").empty();
    $('#tabs').addClass('hide')
    $('#mapform').addClass('hide')
    $('#curSegments').addClass('hide')
    $('#signOut').addClass('hide')
    $('#deleteSeg').removeClass('hide');
}
$('#signIn').submit(function(event) {
    event.preventDefault()
    var emailAddress = $('#emailAddressInput #icon_prefix').val();
    if (isValidEmail(emailAddress)) {
        socket.emit('signin', emailAddress);
    } else {
        Materialize.toast("Invalid email address", 4000)
    }
})

socket.on("signInReturn", function(msg) {
    if (msg.valid) {
        signIn(msg.name)
    } else {
        Materialize.toast("Account is not registered", 4000);
    }
})
var activeItems = new Set();
var mySegments = null;
socket.on("segmentsAcc", function(segments) {
    activeItems.clear();
    $("#selectedStreets").empty();
    mySegments = segments;
    for (var i in segments) {
        $("#selectedStreets").append("<a href=\"#!\" id=\"collection-item-"+i+"\" onclick=\"changeActive(this)\" class=\"collection-item\">" + feature_description(segments[i]) + "</a>");
    }
    if(segments.length == 0){
        $("#selectedStreets").html("You have not claimed any streets yet")
        $("#deleteSeg").addClass("disabled");
    }
    else{
        $("deleteSeg").removeClass('disabled');
    }
    if($('#selectedStreets').html() == "") {
        $('#selectedStreets').append('no current street segments to clean')
    }
})
$('#signOut').click(function(event) {
    clearSegments();
    signOut();
    // exit user session
})
$("#deleteSeg").on('click', function(event){
    var itemsArr = Array.from(activeItems);
    var toSend = [];
    for(var i in itemsArr){
        // console.log(itemsArr+" "+i)
        // console.log(mySegments)
        toSend.push(mySegments[itemsArr[i]]);
    }
    // console.log(toSend)
    socket.emit('deleteSeg', toSend);
})
function refreshCurrent(){
    var emailAddress = $('#emailAddressInput #icon_prefix').val();
    $("#selectedStreets").html("loading...");
    socket.emit("reqSegAcc", emailAddress);
}

$("#curSegTab").on('click', function() { refreshCurrent()});

socket.on("updateCurSeg", function() { refreshCurrent()})
socket.on("deleteSegSuccess", function(){
    Materialize.toast("Successfully removed segment", 4000);
    refreshCurrent();
})
function changeActive(element) {
    var index = parseInt($(element).attr('id').substring(16));
    if ($(element).hasClass('active')) {
        activeItems.delete(index);
        $(element).removeClass('active')
    } else {
        activeItems.add(index);
        $(element).addClass('active');
    }
}
// $(".collection .collection-item").on("click", function() {
//     changeActive(this)
// })
$('#mapform').submit(function(event) {
    event.preventDefault();
    var emailInput = $('#icon_prefix').val();
    var stateInput = $("input:checked").val();

    if (!isValidEmail(emailInput)) {
        console.log('bad email address');
        // $('#submitted').empty();
        // $('#segments').html('<br>');
        // $('#invalidEmail').html("invalid email address");
        // for (var i = 0; i < curFeatureIds.length; i++)
        // {
        //     map.removeLayer(curFeatureIds[i]);  
        //     map.removeSource(curFeatureIds[i]);
        // }
        // curFeatureIds = [];
        // curFeatures = [];
        Materialize.toast("invalid email address<br>", 4000)
    } else {
        console.log('about to socket.emit sendInfo');
        socket.emit('sendInfo', {
            emailAddress: emailInput,
            newState: stateInput,
            featureIds: curFeatureIds
        });
        console.log('socket.emit sendInfo');

        $('#invalidEmail').empty();
        // $('#submitted').html("Thanks for updating these streets");
        // Materialize.toast("Thanks for updating these streets<br>", 4000)
        return false;
    }
    return false;
});