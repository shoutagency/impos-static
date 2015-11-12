var geocoder = [];
var map = [];
var marker = [];
function initialize(mapDiv, node) {
	geocoder[node] = new google.maps.Geocoder();
	var latlng = new google.maps.LatLng(-37.788081,144.961853);
	var myOptions = {
		zoom: 14,
		center: latlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		panControl: false,
		zoomControl: false,
		mapTypeControl: false,
		scaleControl: false,
		streetViewControl: false,
		scrollwheel: false,
		overviewMapControl: false
	}
	map[node] = new google.maps.Map(document.getElementById(mapDiv), myOptions);
}

function codeAddress(address, node) {
	geocoder[node].geocode( {
		'address': address
	}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			map[node].setCenter(results[0].geometry.location);
			marker[node] = new google.maps.Marker({
				map: map[node],
				position: results[0].geometry.location
			});
		}
	});
}
window.addEvent("domready", function() {

	var form = $(document.body).getElement('form.addEditForm');
	form.addEvent('submit', function(e) {
		e.preventDefault();
		try {
			_gaq.push(['_trackEvent', 'Contact', 'Submit', 'Contact Form']);
		}
		catch(err) {
			// do nothing, _gaq is not present, still submit the form, just no tracking
		}
		form.submit();
	});

	Object.each(addresses, function(address, node) {
		mapHolder = node.toInt();
		initialize('mapHolder-'+node, node);
		if(address)
		codeAddress(address, node);
	});
});