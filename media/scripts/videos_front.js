window.addEvent("domready", function() {

	if(!Browser.Platform.ios && !Browser.Platform.android && !Browser.Platform.webos) {

		new multiBox({
			mbClass: '.mb',
			container: document.body,
			useOverlay: true,
			showControls: false,
			showNumbers: false
		});
	} 
	else {
		$$('.mb').each(function(a) {
			a.set('href', a.get('actual'));
			a.set('target', '_blank');
		});
	}
});