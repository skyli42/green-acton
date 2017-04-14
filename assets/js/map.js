mapboxgl.accessToken = 'pk.eyJ1IjoiZ3JlZW5hY3RvbiIsImEiOiJjaXlobXFxdTYwNXpuMzJvZTkyaHZkY3FnIn0.eTMHeFb7rAlnxU08juWXzQ';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/greenacton/ciyhnkn57002n2ro46orppg16',
    center: [-71.432, 42.482],
    zoom: 12,
    maxzoom: 22,
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
const LINE_WIDTH_WIDE = 12.5
const LINE_WIDTH_VERYWIDE = 20


var hoverLayer = {'id': 'hoverLayer',
                'type': 'line',
                'source': 'hoverLayer',
                'layout': { 
                    'visibility': 'visible'
                },
                'paint': {
                    'line-opacity': 0.28,
                    'line-width': LINE_WIDTH_WIDE
                }
}


var hoverFeature = null;
                  
function hoverFeatureShow(feature)
{  
                 if (hoverFeature==null)
                 {
                    hoverFeature = feature; 
                    map.addSource('hoverLayer', { type: 'geojson', data: feature });
                    map.addLayer(hoverLayer);
                 }
                 else{
                     map.getSource('hoverLayer').setData(feature);
                     map.setLayoutProperty('hoverLayer', 'visibility', 'visible');
                 }
}
function hoverFeatureHide()
{
    if (hoverFeature){
        map.setLayoutProperty('hoverLayer', 'visibility', 'none');
    }
        
}

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

var justSentSome = [];


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
        feature = features[0];
        hoverFeatureShow(feature)
        index = Math.floor(feature.geometry.coordinates.length / 2);
        var location = feature.geometry.coordinates[index];
        // console.log("H:" + index + ":" + location)
        popup.setLngLat(location)
            .setText(feature_description(feature))
            .addTo(map);
    }
    else {
        popup.remove();

        hoverFeatureHide();
    }
});

var colorMap = [{
    rgb: 'rgb(238,23,23)'  // needs cleaning - red
}, {
    rgb: 'rgb(22,87,218)'   // claimed - blue
}, {
    rgb: 'rgb(0,255,43)'    // clean - green
}, {
    rgb: 'rgb(0,0,0)'       // unknown - black
}];

function buildSegKey(feature)
{
    return feature.properties.street + "" + feature.properties.id;
}


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
        var idToSend = buildSegKey(features[i]);
        var alreadySelected = curFeatureIds.indexOf(idToSend);
        console.log("selected index is " + alreadySelected);
        if (alreadySelected == -1) {
            // not already selected - select it
            newState = parseInt($("input:checked").val());
            features[i].properties.state = newState;
            curFeatureIds.push(idToSend);
            curFeatures.push(features[i]);
            console.log("will select" + idToSend);
            if (map.getLayer(idToSend)){
                map.setPaintProperty(idToSend, 'line-width', LINE_WIDTH_WIDE);
                map.setPaintProperty(idToSend, 'line-color', colorMap[newState].rgb);
            } else{
                map.addLayer({
                    'id': idToSend,
                    'type': 'line',
                    'source': {
                    'type': 'geojson',
                    'data': features[i]
                },
                'layout': {},
                'paint': {
                    'line-color': colorMap[newState].rgb,
                    'line-opacity': 0.28,
                    'line-width': LINE_WIDTH_WIDE
                }
                });
            }
        } else {
            console.log("will deselect " + idToSend);
            curFeatureIds.splice(alreadySelected, 1);
            curFeatures.splice(alreadySelected, 1);
            map.setPaintProperty(alreadySelected, 'line-width', 0);
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
    for (var i = 0; i < curFeatureIds.length; i++) {
        curFeatures[i].properties.state = stateInput;
        console.log("Changed feature state: ")
        console.log(curFeatures[i].properties)
        map.setPaintProperty(curFeatureIds[i], 'line-color', newColor);
    }
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
        map.setPaintProperty(curFeatureIds[i], 'line-width', 0);
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
    processClaimedSegmentsList([]);
    mySegments=null;
    activeItems.clear();
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
        Materialize.toast(messages.myMessages.properties[messages.myMessages.NEW_EMAIL].msg_string, 4000);
        localMessageHandler(messages.myMessages.NEW_EMAIL);
    }
})
var activeItems = new Set();
var mySegments = null;

function processClaimedSegmentsList(segments)
{
    activeItems.clear();
    $("#deleteSeg").addClass("disabled");
    $("#selectedStreets").empty();
    if (justSentSome.length)
    {
        console.log("processing JustSentSome")
        console.log(justSentSome)
        Array.prototype.push.apply(segments, justSentSome);
        justSentSome = [];
    }

    mySegments = segments;
    for (var i in segments) {
        $("#selectedStreets").append("<a href=\"#!\" id=\"collection-item-"+i+"\" onclick=\"changeActive(this)\" class=\"collection-item\">" + feature_description(segments[i]) + "</a>");
        var idToSend = buildSegKey(segments[i]);
        if (map.getLayer(idToSend)){
            map.setPaintProperty(idToSend, 'line-width', LINE_WIDTH_WIDE);
        } else{
            map.addLayer({
                'id': idToSend,
                'type': 'line',
                'source': {
                    'type': 'geojson',
                    'data': segments[i]
                },
                'layout': {},
                'paint': {
                    'line-color': colorMap[1].rgb,
                    'line-opacity': 0.28,
                    'line-width': LINE_WIDTH_WIDE
                }
            });
        }
            
    }
    if(segments.length == 0){
        $("#selectedStreets").html("You have not claimed any streets yet")
    }
}

socket.on("segmentsAcc", function(segments) {
  processClaimedSegmentsList(segments);  
})

$('#signOut').click(function(event) {
    signOut();
    // exit user session
})

$("#deleteSeg").on('click', function(event){
    var itemsArr = Array.from(activeItems);
    var toSend = [];
    for(var i in itemsArr){
        // console.log(itemsArr+" "+i)
        // console.log(mySegments)
        var featureToBeDeleted = mySegments[itemsArr[i]]; 
        toSend.push(featureToBeDeleted);
        id = buildSegKey(featureToBeDeleted);
        // stop it from appearing selected
        map.setPaintProperty(id, 'line-width', LINE_WIDTH_THIN);
        // make it red (needscleaning)
        map.setPaintProperty(id, 'line-color', colorMap[0].rgb);
        map.setPaintProperty(id, 'line-opacity', 0.6)
        mySegments.splice(itemsArr[i], 1);
    }
    // console.log(toSend)
    socket.emit('deleteSeg', toSend);
    processClaimedSegmentsList(mySegments)
})
function refreshCurrent(){
    if (mySegments == null){
        var emailAddress = $('#emailAddressInput #icon_prefix').val();
        $("#selectedStreets").html("loading...");
        socket.emit("reqSegAcc", emailAddress);
    } else{
        processClaimedSegmentsList(mySegments)  
    }
}

function hideNew() {
    for (var i = 0; i < curFeatureIds.length; i++) {
             map.setPaintProperty(curFeatureIds[i], 'line-width', LINE_WIDTH_THIN);
    }
}
function showNew() {
    for (var i = 0; i < curFeatureIds.length; i++) {
             map.setPaintProperty(curFeatureIds[i], 'line-width', LINE_WIDTH_WIDE);
    }
}

function hideCurrent() {
    if (mySegments == null) return;
    for (var i = 0; i < mySegments.length; i++) {
             map.setPaintProperty(buildSegKey(mySegments[i]), 'line-width', LINE_WIDTH_THIN);
    }
}

$("#curSegTab").on('click', function() { hideNew(); refreshCurrent()});

$("#newSegTab").on('click', function() { hideCurrent(); showNew(); });

socket.on("updateCurSeg", function() { refreshCurrent()})
socket.on("deleteSegSuccess", function(){
    Materialize.toast("Successfully removed segment", 4000);
    refreshCurrent();
})
function changeActive(element) {
    var index = parseInt($(element).attr('id').substring(16));
    var feature = mySegments[index]; 
    var idToUse = buildSegKey(feature);
    if ($(element).hasClass('active')) {
        activeItems.delete(index);
        $(element).removeClass('active')
        map.setPaintProperty(idToUse, 'line-width', LINE_WIDTH_WIDE);
    } else {
        activeItems.add(index);
        $(element).addClass('active');
        map.setPaintProperty(idToUse, 'line-width', LINE_WIDTH_VERYWIDE);
        // zoom to new active element
        var coordinates = feature.geometry.coordinates;
        var bounds = coordinates.reduce(function(bounds, coord) {
            return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.fitBounds(bounds, {
            padding: 60
        });
    }
    
    if (activeItems.size == 0){
        $("#deleteSeg").addClass("disabled");
    } else if (activeItems.size == 1){
        $("#deleteSeg").removeClass("disabled");
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
        return false;
    }
    return false;
});

function localMessageHandler(msg) {
    switch (msg) {
        case messages.myMessages.NEW_EMAIL:
            $('#loginMessages').html('Unrecognized Email. Correct it or <a href="/register">register this email here.</a>');
            break;
        case messages.myMessages.SUBMIT_OK:
            console.log("submit OK received for..")
            for (var i = 0; i < curFeatureIds.length; i++) {
                submittedFeature = curFeatures[i];
                submittedKey = buildSegKey(submittedFeature) 
                console.log(submittedFeature.properties)
                
                map.setPaintProperty(submittedKey, 'line-width', LINE_WIDTH_THIN);
                // push to the claimed segment list if it's a transition to 'claimed' not there already
                if (submittedFeature.properties.state == 1 && mySegments && mySegments.reduce(function(NotFound, feature, i, a) {
                    NotFound && (submittedKey != buildSegKey(feature))}, true)){
                        justSentSome.push(submittedFeature);                    
                }
                else { //possibly remove this from local claimed segment list 
                    mySegments && (mySegments = mySegments.filter(function(feature) { return submittedKey !== buildSegKey(feature)}))
                }
            }
            clearSegmentList();
            break;
    }
}
