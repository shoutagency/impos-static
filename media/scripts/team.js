window.addEvent("domready", function() {

	var teamHolder = $(document.body).getElement("div.team");

	var team = JSON.parse(json);
	
	var tips = [];
	team.each(function(member) {
		
		var map = new Element('div', {
			styles: {
				'z-index': member.z,
				'width': member.bottomright[0] - member.topleft[0],
				'height': member.bottomright[1] - member.topleft[1],
				'position': 'absolute',
				'left': member.topleft[0],
				'top': member.topleft[1],
			},
			'class': 'tooltip'
		}).inject(teamHolder);

		var title = '<strong>' + member.name + '</strong>';
		if(member.title)
			title += '<br />' + member.title;

		var text = '';
		if(member.quote)
			text = '"' + member.quote + '"';

		map.store('tip:title', title);
		map.store('tip:text', text);

		tips.push(map);
	});

	new Tips(tips, {
		'className': 'teamTooltips'
	});
});