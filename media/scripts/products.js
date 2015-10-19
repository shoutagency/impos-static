window.addEvent("domready", function() {
	var slideContainer = $('slider');
	if(slideContainer) {
		slideContainer.getFirst('.slide').addClass('current firstSlide');
		slideContainer.getLast('.slide').addClass('lastSlide');
		var height = 410;
		var slides = slideContainer.getElements('.slide');
		slides.each(function(slide) {
			if(slide.offsetHeight > height)
				height = slide.offsetHeight;
			slide.setStyles({
				position: 'absolute',
				top: 0,
				left: 0,
				'z-index': 1
			});
			if(!slide.hasClass('current'))
				slide.setStyle('opacity', 0);
			else
				slide.setStyle('z-index', 50);
		});
		slideContainer.setStyle('min-height', height);
		$('nextSlide').addEvent('click', function(e) {
			e.preventDefault();
			var current = slideContainer.getElement('.current');
			current.fade('out').removeClass('current').getNext('div.slide').fade('in').addClass('current');
			if(current.getNext('div').hasClass('lastSlide'))
				$('nextSlide').fade('out');
			$('prevSlide').fade('in');
		});
		$('prevSlide').addEvent('click', function(e) {
			e.preventDefault();
			var current = slideContainer.getElement('.current');
			current.fade('out').removeClass('current').getPrevious('div.slide').fade('in').addClass('current');
			if(current.getPrevious('div').hasClass('firstSlide'))
				$('prevSlide').fade('out');
			$('nextSlide').fade('in');
		});
	}
	new multiBox({
		mbClass: '.mb',
		container: document.body,
		useOverlay: true,
		showControls: false,
		showNumbers: false
	});
});