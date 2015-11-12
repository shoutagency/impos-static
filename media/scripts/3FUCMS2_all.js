if (!window.console) {
	window.console = {
		// incase any console.logs are left in
		log: function(obj){}
	};
}
var listTable;

var fixedClone = function(event,element){
	element.getChildren('td').each(function(td){
		td.setStyle('width',td.getComputedSize().width);
	});
	var table = new Element('table').grab(element.clone(true)).setStyles({
		margin: '0px',
		position: 'absolute',
		visibility: 'hidden',
		opacity: '.5',
		'width': element.getStyle('width')
	}).addClass('listTable').inject(document.body).position(element.getPosition());
	element.getChildren('td').each(function(td){
		td.setStyle('width','');
	});
	return table;
};

var prepareCalendar = function(div) {
	var daySelect = div.getElement('.day');
	var monthSelect = div.getElement('.month');
	var yearSelect = div.getElement('.year');
	var calendar = {};
	var params = {};
	params[daySelect.get('id')] = 'j';
	params[monthSelect.get('id')] = 'n';
	params[yearSelect.get('id')] = 'Y';
	calendar[yearSelect.get('id')] = params;
	new Calendar(calendar,{
		draggable:false
	});
};

var Table = new Class({
	Implements: Options,
	options: {
		selectable: true,
		publish: true,
		sortable: false,
		controller: '',
		header: true
	},
	initialize: function(id,options){
		this.setOptions(options);
		this.table = $(id);
		if (this.options.sortable){
			this.initializeSortables();
		}
		this.setupTable(true);
	},
	setupTable: function(initial, dragging){
		if(dragging == undefined) dragging = 0;
		this.table.getElements('tr').each(function(row,index){
			if (index == 0 && this.options.header == true){
				this.tableheader = row;
				row.addClass('adminTH');
			}
			else{
				if ((index + dragging) % 2 == 1)
					row.addClass('alternate');
				else
					row.removeClass('alternate');
				if (initial == true){
					row.addEvent('mouseleave',function(){
						this.removeClass('over');
					});
					row.addEvent('mouseenter',function(){
						this.addClass('over');
					});
				}
			}
			if (initial == true){
				if (this.options.selectable)
					this.initializeCheckbox(row,index);
				if (this.options.publish)
					this.initializePublish(row,index);
			}
		}.bind(this));
		
		this.table.getElements('.tooltip').each(function(tip) {
			if (tip.get('title')){
				var content = tip.get('title').split('::');
				tip.store('tip:title', content[0]);
				tip.store('tip:text', content[1]);
			}
		});

		new Tips(this.table.getElements('.tooltip'), {
			className: 'tooltipHolder',
			showDelay: 600
		});
	},
	initializeCheckbox: function(row,index){
		if (index == 0){
			this.tableheader.checkbox = row.getElement('input[type=checkbox]');
			if (this.tableheader.checkbox == null){
				this.options.selectable = false;
				return;
			}
			this.tableheader.checkbox.addEvent('click',function(){
				this.selectAll(this.tableheader.checkbox.checked);
			}.bind(this));
			this.unchecked = 0;
			this.rowCount = 0;
		}
		else{
			this.clickRow(row);
			row.checkbox = row.getElement('input[type=checkbox]');
			row.checkbox.addEvent('click',function(){
				this.selectRow(row,row.checkbox.checked,true);
			}.bind(this));
			this.rowCount++;
			if (!row.checkbox.checked)
				this.unchecked++;
		}
	},
	clickRow: function(row){
		row.getChildren().each(function(cell){
			cell.getChildren().each(function(child){
				child.addEvent('mouseenter',function(){
					row.removeEvents('click');
				});
				child.addEvent('mouseleave',function(){
					row.addEvent('click',function(){
						this.selectRow(row);
					}.bind(this));
				}.bind(this));
			}.bind(this));
		}.bind(this));
		row.addEvent('click',function(){
			this.selectRow(row);
		}.bind(this));
	},
	selectAll: function(value){
		this.table.getElements('tr').each(function(row){
			this.selectRow(row,value);
		}.bind(this));
	},
	selectRow: function(row,value,fromCheckbox){
		if (value == undefined)
			value = !row.checkbox.checked
		if (value != row.checkbox.checked || fromCheckbox){
			if (value){
				row.addClass('selected');
				this.unchecked--;
			}
			else{
				row.removeClass('selected');
				this.unchecked++;
			}
		}
		row.checkbox.checked = value;
		this.tableheader.checkbox.checked = this.unchecked == 0;
	},
	initializePublish: function(row,index){
		if (index == 0){}
		else{
			var image = row.getElement('img[id^=publish]');
			image.setStyle('cursor','pointer');
			image.addEvent('click', function() {
				temp = image.id.split('-');
				var id = temp[1];
				new Request({
					url: siteAddress+this.options.controller+'/publish/'+id,
					onRequest: function() {
						if(image.src.substr(-8, 4)=='tick') {
							image.src = siteAddress+'images/cross.gif';
						} else {
							image.src = siteAddress+'images/tick.gif';
						}
					}
				}).send();
			}.bind(this));
		}
	},
	initializeSortables: function(){
		var table = this;
		this.table.getElements('tbody').each(function(tbody){
			new Sortables(tbody,{
				constrain:true,
				handle:'img.handle',
				onSort:function() {
					table.setupTable(false, 1);
				},
				onComplete:function(element) {
					table.setupTable();
					var array = [];
					element.getParent().getChildren().getElement('input[type=checkbox]').each(function(checkbox, i) {
						array[i] = checkbox.get('id').split("_")[1];
					});
					new Request({
						url: siteAddress+currentController+'/sort',
						method: 'get'
					}).send('order='+array.join());
				},
				clone:fixedClone
			});
		});
	}

});

var FieldTable = new Class({
	Extends: Table,
	options: {
		sortable: false,
		controller: '',
		sortUrl: '',
		refreshFunction: '',
		title: ''
	},
	initialize: function(id,options){
		this.setOptions(options);
		this.table = $(id);
		if (this.options.sortable){
			this.initializeSortables();
		}
		this.setupTable(true);
	},
	setupTable: function(initial, dragging){
		this.setupEdits();
		this.setupAdd();
	},
	setupAdd: function() {
		var table = this;
		$(this.table.get('id')+'_add').addEvent("click", function(e) {
			e.preventDefault();
			table.popupForm(this);
		});
	},
	setupEdits: function() {
		var table = this;
		this.table.getElements('a[id^='+this.table.get('id')+']').each(function(editLink) {
			editLink.addEvent("click", function(e) {
				e.preventDefault();
				table.popupForm(editLink);
			});
		});
	},
	popupForm: function(clicked) {
		var table = this;
		new PopupForm({
			title: table.options.title,
			url: clicked.get('href'),
			onLoad: function() {
				var form = $('popup-text').getElement('form')
				form.set('send',{
					onRequest:function(){
						$('popup-confirm').setProperty('disabled',true);
						$('popup-cancel').setProperty('disabled',true);
					},
					onComplete:function(response){
						response = JSON.decode(response);
						if (response.error !== false){
							$('popup-messages').set('html', response.error);
							$('popup-confirm').setProperty('disabled',false);
							$('popup-cancel').setProperty('disabled',false);
							return;
						}

						$('popupContainer').destroy();

						//refresh fieldTable list
						table.options.refreshFunction();
					}
				});
				form.addEvent('submit', function(event){
					event.stop();
					form.send();
				});
			},
			onConfirm: function() {
				$('popup-text').getElement('form').send();
				return false;
			}
		});
	},
	initializeSortables: function() {
		var table = this;
		this.table.getElements('tbody').each(function(tbody){
			new Sortables(tbody,{
				constrain:true,
				handle:'img.handle',
				onSort:function() {
					table.setupTable(false, 1);
				},
				onComplete:function(element) {
					table.setupTable();
					var array = [];
					element.getParent().getChildren().getElement('a[id^='+table.table.get('id')+']').each(function(editLink, i) {
						array[i] = editLink.get('id').split("_")[1];
					});
					new Request({
						url: table.options.sortUrl,
						method: 'get'
					}).send('order='+array.join());
				},
				clone:fixedClone
			});
		});
	}
});

var Popup = new Class({
	Implements: Options,
	options: {
		title: '',
		msg: '',
		onCancel: function(){},
		onConfirm: function(){},
		onPopup: function(){},
		textclass: 'text' //fluent/fixed/text
	},
	initialize: function(options){
		this.setOptions(options);
		this.popupContainer = new Element('div', {
			'class': 'popupContainer',
			'id': 'popupContainer',
			'html': '<table id="popupTable" class="popupTable"><tr><td class="popup-topleft"><td class="popup-border"><td class="popup-topright"></tr>'+
		'<tr><td class="popup-border"><td class="popup-content" id="popup-content"><td class="popup-border"></tr>'+
		'<tr><td class="popup-bottomleft"><td class="popup-border"><td class="popup-bottomright"></tr>'+
		'</table>'
		}).inject(document.body);
		$('popupTable').setStyle('top', window.getScroll().y+125);
		$('popupTable').setStyle('margin-left', (window.getCoordinates().width-$('popupTable').getStyle('width').toInt())/2);
		$('popup-content').innerHTML =	'<div class="popup-title">'+this.options.title+'</div>'+
		'<div class="popup-'+this.options.textclass+'" id="popup-text">'+this.options.msg+'</div>'+
		'<div style="float: right; padding: 4px;"><input type="button" class="form-submit" value="Confirm" id="popup-confirm" /> '+
		'<input type="button" class="form-cancel" value="Cancel" id="popup-cancel"/></div>';
		$('popup-cancel').addEvent('click',function(){
			this.options.onCancel();
			this.popupContainer.destroy();
		}.bind(this));
		$('popup-confirm').addEvent("click", function() {
			if (this.options.onConfirm() !== false)
				this.popupContainer.destroy();
		}.bind(this));
		this.options.onPopup();
	}
});

var PopupForm = new Class({
	Extends: Popup,
	Implements: Options,
	options: {
		title: '',
		url: '',
		textclass: 'fluent',
		queryString: '',
		msg: '<div class="ajaxLoading"></div>',
		onConfirm: function(){
			$('popup-text').getElement('form').submit();
		},
		onLoad: function(){

		}
	},
	initialize: function(options){
		this.setOptions(options)
		this.parent(this.options);
		new Request.HTML({
			url:this.options.url+'?from=ajax&'+this.options.queryString,
			update:$('popup-text'),
			onSuccess: this.options.onLoad
		}).get();
	}
})

MyHistoryManager = new Class({
	Implements: Options,
	options: {
		url: '',
		arguments: {},
		paginate: true,
		onUpdate: function(){},
		header: true
	},
	initialize: function(options){
		this.setOptions(options);
		this.processArguments();

		HistoryManager.initialize();
		this.history = HistoryManager.register(
			'history',
			this.arguments.defaults,
			function(values) {
				this.changeTable(values);
			}.bind(this),
			function(values) {
				var result = new Array();
				for(var i=0;i<values.length;i++){
					result.push(values[i]);
				}
				return 'history(' + result.join(',') + ')';
			},
			this.arguments.regex
			);

		this.req = new Request.HTML({
			url: this.options.url,
			method: 'get',
			update: $('list'),
			link: 'cancel',
			onComplete: function(){
				if ($('listTable')){
					listTable = new Table('listTable',{
						selectable:true,
						publish:false,
						controller:currentController
					});
					$('list').getElement('form').action += '?hash='+HistoryManager.getHash();
				}
				this.paginationSetup();
				this.options.onUpdate();
			}.bind(this)
		});

		this.delay = 0;

		for(var i=0;i<this.arguments.length;i++){
			if ($(this.arguments.names[i])){
				if($(this.arguments.names[i]).get('type')=='text') {
					$(this.arguments.names[i]).addEvent('keyup', function(){
						$clear(this.delay);
						this.delay = (function() {
							this.resetTable()
						}).bind(this).delay(500);
					}.bind(this));
				} else if($(this.arguments.names[i]).get('type')=='checkbox') {
					$(this.arguments.names[i]).addEvent('click', function(){
						this.resetTable();
					}.bind(this));
				} else {
					$(this.arguments.names[i]).addEvent('change', function(){
						this.resetTable()
					}.bind(this));
				}
			}
		}

		if (this.options.paginate)
			this.paginationSetup();
		HistoryManager.start();
	},
	changeTable: function(values) {
		this.history.setValues(values);
		var request = new Array();
		for(var i=0;i<this.arguments.length;i++){
			request.push(this.arguments.names[i]+'='+values[i]);
			if ($(this.arguments.names[i]))
				$(this.arguments.names[i]).value = unescape(values[i]);
		}
		if (this.options.paginate){
			page = values[this.arguments.length];
			request.push('page='+values[this.arguments.length]);
		}
		$('list').getChildren().setStyle('opacity', .5);
		this.req.send('from=ajax&'+request.join('&'));
	},
	resetTable: function(page) {
		var values = new Array();
		for(var i=0;i<this.arguments.length;i++){
			var value = $(this.arguments.names[i]).value;
			if($(this.arguments.names[i]).get('type')=='checkbox') {
				if($(this.arguments.names[i]).checked == true) {
					value = 1;
				} else {
					value = 0;
				}
			}
			values.push(value);
		}
		if (this.options.paginate)
			if (page == undefined)
				values.push('1');
			else
				values.push(page);
		this.changeTable(values);
	},
	processArguments: function(){
		this.arguments = new Object;
		this.arguments.defaults = new Array();
		var expression = new Array();
		this.arguments.names = new Array();
		for(var argument in this.options.arguments){
			this.arguments.defaults.push(this.options.arguments[argument]);
			expression.push('([^,]*)');
			this.arguments.names.push(argument);
		}
		if (this.options.paginate == true){
			this.arguments.defaults.push('1');
			expression.push('(\\w*)');
		}
		this.arguments.regex = new RegExp('history\\('+expression.join(',')+'\\)');
		this.arguments.length = this.arguments.names.length;
	},
	paginationSetup: function() {
		if($('pagination')) {
			var paginations = $(document.body).getElements('.pagination');
			paginations.each(function(pagination,i) {
				pagination.getElements('a').each(function(a) {
					a.addEvent('click', function(e) {
						if (e) new Event(e).stop();
						page = a.id.split('-')[1];
						this.resetTable(a.id.split('-')[1]);
					}.bind(this));
				}.bind(this));
			}.bind(this));
		}
	}
});

var PopupAjaxForm = new Class({
	Implements: [Options, Events],
	options: {
		title: '',
		url: '',
		textclass: 'fluent', //fluent/fixed/text
		destroyOnSuccess: true,
		confirm: 'Confirm',
		cancel: 'Cancel',
		data: {}
		/*
		onCancel: $empty,
		onConfirm: $empty,
		onPopup: $empty,
		onLoad: $empty,
		onSuccess: $empty
		*/
	},
	initialize: function(options){
		this.setOptions(options);

		this.container = new Element('div', {
			'class': 'popupContainer',
			'id': 'popupContainer',
			'html': '<table id="popupTable" class="popupTable"><tr><td class="popup-topleft"><td class="popup-border"><td class="popup-topright"></tr>'+
		'<tr><td class="popup-border"><td class="popup-content" id="popup-content"><td class="popup-border"></tr>'+
		'<tr><td class="popup-bottomleft"><td class="popup-border"><td class="popup-bottomright"></tr>'+
		'</table>'
		});
		this.container.fade('hide');
		this.container.inject(document.body);
		this.container.fade('in');


		var table = this.container.getElement('table');
		table.setStyle('top', 125);
		table.setStyle('margin-left', (window.getCoordinates().width-table.getStyle('width').toInt())/2);

		this.text = new Element('div', {
			'class':'popup-'+this.options.textclass,
			'id':'popup-text',
			'styles' : {
				'overflow-y' : 'auto',
				'overflow-x' : 'hidden',
				'max-height': window.getSize().y - 342 //Creates the 125px gap at the bottom
			}
		}).adopt(
			new Element('div', {'class':'ajaxLoading'})
		);

		if (Browser.Engine.trident4)
			this.text.setStyle('height', this.text.getStyle('max-height'));

		this.buttons = new Element('div', {
			'styles':{
				'float':'right',
				'padding':'4px'
			}
		});

		this.container.getElement('td.popup-content').adopt(
			new Element('div', {
				'class':'popup-title',
				'text':this.options.title
			}),
			this.text,
			this.buttons
		);

		new Element('input', {
			'type':'button',
			'class':'form-submit',
			'value':this.options.confirm,
			'id':'popup-confirm'
		}).inject(this.buttons);

		new Element('input', {
			'type':'button',
			'class':'form-cancel',
			'value':this.options.cancel,
			'id':'popup-cancel',
			'events':{
				'click': function() {
					this.fireEvent('cancel');
					this.destroy();
				}.bind(this)
			}
		}).inject(this.buttons);

		this.fireEvent('popup');
		this.loadForm();
	},
	loadForm: function(){
		var data = new Hash({'from':'ajax'});
		data.combine(this.options.data);
		new Request({
			url: this.options.url,
			onSuccess: function(response){
				this.text.set('html', response);
				this.fireEvent('load');
				var form = this.text.getElement('form');
				form.set('send', {
					onSuccess: function(response){
						this.fireEvent('success',[response]);
						if (this.options.destroyOnSuccess)
							this.destroy();
					}.bind(this)
				});
				form.addEvent('submit', function(event){
					event.stop();
					form.send();
				});
				this.buttons.getElements('input.form-submit').addEvent('click', function(){
					form.send();
				});
			}.bind(this)
		}).get(data);
	},
	destroy: function(){
		this.container.fade('hide');
		this.container.destroy();
	},
	toElement: function(){
		return this.container;
	}
});

MultiSelect = new Class({
	Implements: [Options,Events],
	options: {
		hideDelay: 500,
		empty: '&laquo; Select &raquo;'
	},
	initialize: function(element, options){
		element = $(element);
		this.setOptions(options);
		this.attach(element);
	},
	attach: function(element){
		var container = this.container = new Element('div',{
			'style':'display:none;',
			'class':'options'
		});
		this.name = element.get('name');
		element.getChildren().each(function(child){
			if (child.get('tag') == 'optgroup'){
				this.addOptGroup(child);
			}
			else if(child.get('tag') == 'option'){
				this.addOption(child);
			}
		}.bind(this));
		var div;

		var clickCheck = function(event){
			if (event.target != div && !container.hasChild(event.target)){
				document.body.removeEvent('click',this);
				container.setStyle('display','none');
			}
		};

		div = new Element('div',{
			html:this.options.empty,
			'class':'multiselect',
			events:{
				'click':function(){
					if (container.getStyle('display') == 'block'){
						document.body.removeEvent('click',clickCheck);
						container.setStyle('display','none');
					}
					else{
						document.body.addEvent('click',clickCheck);
						container.setStyle('display','block');
					}
				}.bind(this)
			}
		});

		div.inject(element,'after');
		this.container.inject(div,'after');
		element.destroy();
	},
	addOptGroup: function(optgroup){
		var id = optgroup.get('id')==null?this.name+'-'+optgroup.get('label'):optgroup.get('id');
		var heading = this.createRow(optgroup.get('label'), '', '', id);
		heading.addClass('optgroup');
		heading.inject(this.container);
		var options = new Array();
		optgroup.getChildren('option').each(function(option){
			options.push(this.addOption(option));
		}.bind(this));
		heading.addEvent('checkOptions',function(){
			var checked = 0;
			options.each(function(option){
				if (option.getElement('input').get('checked'))
					checked++;
			})
			if (checked == options.length)
				heading.getElement('input').set('checked','checked');
			else
				heading.getElement('input').set('checked','');
		})
		options.each(function(option){
			option.addEvent('change',function(){
				heading.fireEvent('checkOptions');
			})
		});
		heading.getElement('input').addEvent('change',function(){
			options.each(function(option){
				option.getElement('input').checked = heading.getElement('input').checked;
			});
		})
		heading.fireEvent('checkOptions');
		return heading;
	},
	addOption: function(option){
		var id = option.get('id')==null?this.name+'-'+option.get('value'):option.get('id');
		var row = this.createRow(option.get('html'), this.name, option.get('value'), id, option.get('selected'));
		row.addClass('option');
		row.inject(this.container);
		return row;
	},
	createRow: function(title, name, value, id, selected){
		var label = new Element('label',{
			'style':'display:block',
			'for':id,
			'html':title,
			events:{
				'mouseenter':function(){
					label.addClass('hover');
				},
				'mouseleave':function(){
					label.removeClass('hover');
				}
			}
		});

		var input = new Element('input',{
			type:'checkbox',
			'id':id,
			'name':name,
			'value':value,
			'checked':selected?'checked':'',
			'events':{
				'change':function(event){
					label.toggleClass('selected');
					this.fireEvent('change',event);
				}.bind(this)
			}
		}).inject(label,'top');

		return label;
	},
	change: function(event){

	}
});
window.addEvent("domready", function() {
	$$('.tooltip').each(function(tip) {
		if (tip.get('title')){
			var content = tip.get('title').split('::');
			tip.store('tip:title', content[0]);
			tip.store('tip:text', content[1]);
		}
	});

	new Tips('.tooltip', {
		className: 'tooltipHolder',
		showDelay: 600
	});

	if ($('listTable')){
		listTable = new Table('listTable',{
			selectable:true,
			publish:false,
			controller:currentController
		});
	}


	$(document.body).getElements('input[class=form-cancel]').addEvent("click", function() {
		history.back();
	});
});
