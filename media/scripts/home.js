window.addEvent('domready',function() {
	var holder = $('homeBanner');
	var first = true;
	var blackimages = [0,1,3,4];
	var fx = new Fx.Tween(holder, {
		duration: 300,
		property: 'background-color'
	});

    var homeFeatureTestimonial = $('homeFeatureTestimonial');
	if(homeFeatureTestimonial) {

		var featuredTestimonials = homeFeatureTestimonial.getElements('div');

        // set the height of the container
        var max_height = featuredTestimonials.map(function(item) {
            return $(item).getDimensions().height;
        }).max() + homeFeatureTestimonial.getSize().y;

        var parent = homeFeatureTestimonial.getParent('.testimonial-quote');
        if(max_height > parent.getSize().y)
            parent.setStyle('height', max_height);


		var currentTestimonial = 0;
		featuredTestimonials.setStyle('display', 'block').setOpacity(0);
		featuredTestimonials[currentTestimonial].fade('show');

	}
	
			
	Object.each(bannerImages, function(link, image) {
		new Asset.image(image, {
			onLoad: function() {
				if(first) {
					//First image has loaded, let's fade away
					first = false;
					bannerFade.periodical(7000);
				}
			}
		});
		new Element('a', {
			'href': link,
			'class': 'bannerLink',
			'styles': {
				'background-image': 'url('+image+')'
			}
		}).inject(holder);
	});
	var bannerFade = function() {
		//Get the current showing one
		var current = holder.getElement('.currentBanner');
		var next = current.getNext('a');
		if(!next) //Couldn't get the next so it must be the end
			next = holder.getFirst('a');
		if(current && next != current) {
			next.fade('hide');
			if(blackimages.contains(holder.getChildren().indexOf(next)))
				fx.start('#000000');
			else
				fx.start('#26344e');
			
			current.setStyle('z-index', 1).fade('out').removeClass('currentBanner');
			next.setStyle('z-index', 50).fade('in').addClass('currentBanner');
		}
		// featured testimonials
		if(featuredTestimonials.length > 1) {
			
			featuredTestimonials[currentTestimonial].fade('out');
			
			if(featuredTestimonials[currentTestimonial+1])
				currentTestimonial++;
			else
				currentTestimonial = 0;
			
			featuredTestimonials[currentTestimonial].fade('in');
		}
	}
	
	new Request.HTML({
		url: siteAddress+'home/getLatestTweet',
		update: $('homeTwitter').getElement('div > p')
	}).send();
});