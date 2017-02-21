mapboxgl.accessToken = 'pk.eyJ1IjoiZ3JlZW5hY3RvbiIsImEiOiJjaXlobXFxdTYwNXpuMzJvZTkyaHZkY3FnIn0.eTMHeFb7rAlnxU08juWXzQ';
var tileset = 'acton-streets';
var map = new mapboxgl.Map({

	container: 'map',
	style: 'mapbox://styles/mapbox/streets-v9',
	center: [-71.432, 42.482],
	zoom: 13,
	maxBounds: [[-71.5, 42.429], [-71.375, 42.54]],
});

//access token: sk.eyJ1IjoiZ3JlZW5hY3RvbiIsImEiOiJjaXpiaGkyM3cwcGY1MnhxcHhhZjlpeTZiIn0.cL48iVWM8qYJG6rroRBrow