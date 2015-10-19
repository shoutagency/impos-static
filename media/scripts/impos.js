window.addEvent('domready', function(){
	$(document.body).getElements('.dropDown').each(function(dropDown) {
		dropDown.hide();
		dropDown.getParent().addEvents({
			'mouseenter': function() {
				dropDown.show()
				this.getElement('a').addClass('active');
			},
			'mouseleave': function() {
				dropDown.hide()
				this.getElement('a').removeClass('active');
			}
		});
	});
    $(document.body).addEvent('click:relay(.sideMenuCollapsable .sideMenu .sideMenuTitle a, .subCollapsableMenu a)', function(event, target) {

        event.preventDefault();
        target.getParent('div:not(.sideMenuTitle)').toggleClass('active');

    });
});