mapboxgl.accessToken = 'pk.eyJ1IjoiZ3JlZW5hY3RvbiIsImEiOiJjaXlobXFxdTYwNXpuMzJvZTkyaHZkY3FnIn0.eTMHeFb7rAlnxU08juWXzQ';
var tileset = 'acton-streets';
var map = new mapboxgl.Map({

	container: 'map',
	style: 'mapbox://styles/mapbox/streets-v9',
	center: [-71.432, 42.482],
	zoom: 13
});

//access token: sk.eyJ1IjoiZ3JlZW5hY3RvbiIsImEiOiJjaXpiaGkyM3cwcGY1MnhxcHhhZjlpeTZiIn0.cL48iVWM8qYJG6rroRBrow