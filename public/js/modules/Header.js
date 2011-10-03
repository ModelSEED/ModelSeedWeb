
define(function() {
    var header = {};

    // private vars
    var container, title, name, links;

    header.create = function(params) {
	container = $('<div>');

	title = $('<span>'); // style font with class
	title.append(params.title);
	name = $('<span>'); // style font with class
	name.append(params.name);
	links = $('<span>'); // style font with class
	links.append(params.links);

	var table = $('<table>');
	container.append(table);
	var tr = $('<tr>');
	table.append(tr);
	var titleTd = $('<td style="white-space: nowrap; font-size: 1.5em;">');
	tr.append(titleTd);
	titleTd.append(title);
	
	var nameTd = $('<td style="width: 100%; white-space: nowrap; text-align: center;">');
	tr.append(nameTd);
	nameTd.append(name);

	var linkTd = $('<td style="white-space: nowrap">');
	tr.append(linkTd);
	linkTd.append(links);

	$('body').prepend(container);
    };

    header.update = function(params) {
	if (params.title) {
	    title.empty();
	    title.append(params.title);
	}

	if (params.name) {
	    name.empty();
	    name.append(params.name);
	}

	if (params.links) {
	    links.empty();
	    links.append(params.links);
	}
    };

    return header;
});