mapboxgl.accessToken = 'pk.eyJ1IjoiZ3JlZW5hY3RvbiIsImEiOiJjaXlobXFxdTYwNXpuMzJvZTkyaHZkY3FnIn0.eTMHeFb7rAlnxU08juWXzQ';

var tileset = 'acton-streets';

var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/greenacton/ciyhnkn57002n2ro46orppg16',
	center: [-71.432, 42.482],
	zoom: 13,
	maxBounds: [[-71.5, 42.429], [-71.375, 42.54]],
});
map.on('click', function(e) {
        // set bbox as 5px reactangle area around clicked point
        var bbox = [[e.point.x - 5, e.point.y - 5], [e.point.x + 5, e.point.y + 5]];
        var features = map.queryRenderedFeatures(bbox, {layers:['acton-streets']});
		console.log(features);
        // Run through the selected features and set a filter
        // to match features with unique FIPS codes to activate
        // the `counties-highlighted` layer.
        // var filter = features.reduce(function(memo, feature) {
        //     memo.push(feature.properties.FIPS);
        //     return memo;
        // }, ['in', 'FIPS']);

        // map.setFilter("counties-highlighted", filter);
});

//access token: sk.eyJ1IjoiZ3JlZW5hY3RvbiIsImEiOiJjaXpiaGkyM3cwcGY1MnhxcHhhZjlpeTZiIn0.cL48iVWM8qYJG6rroRBrow