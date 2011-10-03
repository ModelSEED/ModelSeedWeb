/*
 *  Javascript version of the Tobi Table
 * 
 *  Supports static initialization with data, as well as dynamic addition
 *  of cols/rows and much more
 * 
 *  Options:
 *    pagination   - split rows into pages (true)
 *    rowsPerPage  - number of rows per page (20)
 * 
 * 
 * 
 * Testing the ability to render whole rows instead of storing data.
 * This way you can store data outside of the table and it doesn't
 * need to be duplicated in the table. Also there's the idea of search
 * and sort functions for columns, that is you give it a function whose
 * return value will be used to search/sort for that cell.
 * 
 */

define(['/js/modules/Util.js', '/js/lib/jquery-ui.js'], function(util) {
    util.addCSS('/css/jquery-ui.css');
    util.addCSS('/css/JSTable.css');

    var create = function(headerArg, rowsArg, optionsArg) {
	var jstable = {}; // table object that will be returned

    // setup variables
    var numCols = 0;
    var numRows = 0;
    var numFilRows = 0;
    var header = [];
    var rows = [];
    var filRows = [];

    // navigation variables
    var numPages;
    var currentPage;
    var prevNavLinks = $('');
    var nextNavLinks = $('');
    var sliders = $('');
    var rowNavLowArray = [];
    var rowNavHighArray = [];
    var rowNavTotalArray = [];
    var pageNavArray = [];
    var pageNavTotalArray = [];
    var rowsPerPageNavArray = [];

    // events
    var onupdate;

    var headRow;
    var html = null;

    var filters = [];

    // parse the options
    var testOption = function(option) {
	return (optionsArg && $.type(optionsArg[option]) !== 'undefined' && $.type(optionsArg[option]) !== 'null');
    };

    var rowsPerPage = (testOption('rowsPerPage') ? optionsArg.rowsPerPage : 20);
    var pagination = (testOption('pagination') ? optionsArg.pagination : true);

    if ($.isFunction(optionsArg.onupdate)) {
	onupdate = optionsArg.onupdate;
    }

    if (!pagination) {
	rowsPerPage = -1;
    }

    // parse the header
    if (headerArg) {
	if ($.type(headerArg) === "array") {
	    numCols = headerArg.length;
	    header.length = numCols;

	    // loop through headers
	    for (var i=0,ii=headerArg.length; i<ii; i++) {
		var head = headerArg[i];
		var headerObj;
		if ($.type(head) === "object") {
		    // options are provided, check them
		    headerObj = {
			id: (head.id ? head.id : ""+i),
			search: (head.search ? true : false),
			sort: (head.sort ? true : false),
			value: head.value,
			render: ($.isFunction(head.render) ? head.render : undefined)
		    };
		} else {
		    // use default options
		    headerObj = {
			id: ""+i,
			search: false,
			sort: false,
			value: head
		    };
		}

		header[i] = headerObj;
	    }
	}
    }

    // parse the data
    if (rowsArg) {
	if ($.type(rowsArg) === "array") {
	    numRows = rowsArg.length;
	    numFilRows = numRows;
	    rows.length = numRows;

	    // loop through the rows
	    for (var i=0,ii=rowsArg.length; i<ii; i++) {
		var rowArg = rowsArg[i];
		var rowData;
		var row = {};

		if ($.type(rowArg) === "array") {
		    row.id = ""+i;
		    rowData = rowArg;
		} else if ($.type(rowArg) === "object") {
		    row.id = (rowArg.id ? rowArg.id : ""+i);
		    rowData = rowArg.data;
		}

		if (rowData.length === numCols) {
		    row.data = [];
		    row.data.length = numCols;

		    // loop through cells
		    for (var j=0,jj=numCols; j<jj; j++) {
			var cell = rowData[j];

			if ($.type(cell) === "object") {
			    row.data[j] = cell;
			} else {
			    row.data[j] = {value: cell};
			}
		    }
		} else {
		    // warn error
		}

		rows[i] = row;
		filRows[i] = row;
	    }
	}
    }

    if (pagination) {
	numPages = Math.ceil(numRows / rowsPerPage);
	currentPage = 1;
    }

    jstable.getHtml = function() {
	if (html === null) {
	// construct the html for the table
	html = $('<table class="jstable-table">');

	if (pagination) {
	    var topRow = $('<tr>');
	    html.append(topRow);
	    var topTd = $('<td colspan=' + numCols + '>');
	    topRow.append(topTd);
	    topTd.append(createNavBar({pagination: true, slider: true}));
	}

	headRow = $('<tr>');
	for (var i=0; i<numCols; i++) {
	    var head = header[i];
	    
	    // construct the header
	    var headCell = $('<td class="jstable-header">');
	    headRow.append(headCell);

	    if (head.sort) {
		// make header clickable and show images
		var headSpan = $('<span class="jstable-header-span" title="click to sort">');
		headCell.append(headSpan);
		headSpan.append(head.value + '&nbsp;&nbsp;');
		
		// change these to point to correct image
		headSpan.append($('<img src="' + sortUpSrc + '" />'));
		headSpan.append($('<img src="' + sortDownSrc + '" />'));
		
		head.sortOrder = 1;
		
		// TODO: different sorting styles (should automatically detect numbers, i think)
		(function(head) {
		     headSpan.click(function() {
			 // find head in header, in case new column was inserted
			 var index = $.inArray(head, header);
			     if (index >= 0) {
				 filRows.sort(function(a,b) {
				     var ret;
				     var aSort = a.data[index].sort;
				     var bSort = b.data[index].sort;
				     if ((aSort === undefined ? a.data[index].value : aSort) < (bSort === undefined ? b.data[index].value : bSort)) {
					 ret = -1;
				     } else {
					 ret = 1;
				     }

				     if (head.sortOrder) {
					 return ret;
				     } else {
					 return -ret;
				     }
				 });

				 // toggle sortOrder
				 head.sortOrder = (head.sortOrder ? 0 : 1);

				 jstable.update();
			     }
		     });
		 })(head); // provides closure over header
	    } else {
		headCell.append(head.value);
	    }
	    
	    if (head.search) {
		// append a search box
		var searchDiv = $('<div>');
		headCell.append(searchDiv);
		var searchBox = $('<input type="text">');
		searchDiv.append(searchBox);
		head.searchBox = searchBox;

		searchBox.keyup(function() {
				    jstable.filter();
				});
	    }
	}
	html.append(headRow);

	if (pagination) {
	    var botRow = $('<tr>');
	    html.append(botRow);
	    var botTd = $('<td colspan=' + numCols + '>');
	    botRow.append(botTd);
	    botTd.append(createNavBar({pagination: true, rows: true, page: true, rowsPerPage: true}));
	}
	}

	jstable.update();

	return html;
    };
    
    var createNavBar = function(options) {
	var table = $('<table class="jstable-nav-bar">');
	var row = $('<tr>');
	table.append(row);
	
	// add first/prev
	var leftNavTd, rightNavTd;
	if (options.pagination) {
	    var leftNavTd = $('<td>');

	    var firstLink = $('<a class="jstable-nav-link" href="javascript:void(0)">&lt;&lt;first</a>');
	    var prevLink = $('<a class="jstable-nav-link" href="javascript:void(0)">&lt;&lt;prev</a>');
	    leftNavTd.append(firstLink, '<span class="jstable-nav-padding">', prevLink);

	    firstLink.click(function() {navClick($(this), jstable.first);});
	    prevLink.click(function() {navClick($(this), jstable.prev);});

	    prevNavLinks.push(firstLink[0]);
	    prevNavLinks.push(prevLink[0]);
	    
	    row.append(leftNavTd);
	}
	
	var middleTd = $('<td class="jstable-nav-middle">');
	row.append(middleTd);
	if (options.slider) {
	    var slider = $('<div style="margin: 0px 10px;" title="change page"></div>');
	    middleTd.append(slider);
	    slider.slider({
		min: 1,
		max: numPages,
		slide: function(event, ui) {
		    currentPage = ui.value;
		    jstable.update();
		}
	    });
	    sliders.push(slider[0]);
	} else if (options.rows || options.page || options.rowsPerPage) {
	    var middleDiv = $('<div style="text-align: center;">');
	    middleTd.append(middleDiv);
	    if (options.rows) {
		var rowNav = $('<span>');
		middleDiv.append(rowNav);
		
		var rowNavLow = $('<span>0</span>');
		var rowNavHigh = $('<span>0</span>');
		var rowNavTotal = $('<span>' + numRows + '</span>');

		rowNav.append('rows: ');
		rowNav.append(rowNavLow);
		rowNav.append(' - ');
		rowNav.append(rowNavHigh);
		rowNav.append(' of ');
		rowNav.append(rowNavTotal);
		
		rowNavLowArray.push(rowNavLow);
		rowNavHighArray.push(rowNavHigh);
		rowNavTotalArray.push(rowNavTotal);
	    }
	    
	    if (options.rows && options.page) {
		middleDiv.append($('<span class="jstable-nav-padding-medium">'));
	    }
	    
	    if (options.page) {
		var pageNav = $('<span>');
		middleDiv.append(pageNav);
		
		var pageNavEdit = createEditableSpan('0', function(value) {
		    if (isNaN(value)) {
			return false;
		    } else {
			// is a number, check if within page range
			if (value < 1) {
			    return false;
			} else if (value > numPages) {
			    return false;
			}
		    }
							 
		    // it's a valid number, change the page
		    currentPage = parseInt(value, 10);
		    jstable.update();
							 
		    return true;
		});
		var pageNavTotal = $('<span>' + numPages + '</span>');
		
		pageNav.append('page: ');
		pageNav.append(pageNavEdit);
		pageNav.append(' of ');
		pageNav.append(pageNavTotal);
		
		pageNavArray.push(pageNavEdit);
		pageNavTotalArray.push(pageNavTotal);
	    } else if (options.rows && options.rowsPerPage) {
		middleDiv.append($('<span class="jstable-nav-padding-medium">'));
	    }
	    
	    if (options.page && options.rowsPerPage) {
		middleDiv.append($('<span class="jstable-nav-padding-medium">'));
	    }
	    
	    if (options.rowsPerPage) {
		var rppNav = $('<span>');
		middleDiv.append(rppNav);
		
		var largeConfirm = true;
		var rppNavEdit = createEditableSpan(rowsPerPage, function(value) {
		    if (isNaN(value)) {
			return false;
		    } else {
			if (value < 1) {
			    return false;
			} else if (value > numRows) {
			    return false;
			}
		    }

		    value = parseInt(value, 10);

		    // check if value is large
		    if (largeConfirm) {
			if (value >= 500) {
			    largeConfirm = false;
			    $('<p>Setting the rows per page too high may cause the table to become sluggish. Do you want to continue?</p>').dialog({
				resizable: false,
				modal: true,
				buttons: {
				    'Yes': function() {
					changeRowsPerPage(value);
					$(this).dialog('close');
					rppNavEdit.changeVal(value);
				    },
				    'No': function() {
					$(this).dialog('close');
				    }
				}
			    });

			    return false;
			}
		    }

		    changeRowsPerPage(value);
		    return true;
		});
		rppNav.append('rows/page: ');
		rppNav.append(rppNavEdit);
		
		rowsPerPageNavArray.push(rppNavEdit);
	    }
	}
	
	if (options.pagination) {
	    var rightNavTd = $('<td>');
	    
	    var nextLink = $('<a class="jstable-nav-link" href="javascript:void(0)">next&gt;&gt;</a>');
	    var lastLink = $('<a class="jstable-nav-link" href="javascript:void(0)">last&gt;&gt;</a>');
	    rightNavTd.append(nextLink, '<span class="jstable-nav-padding">', lastLink);
	    
	    nextLink.click(function() {navClick($(this), jstable.next);});
	    lastLink.click(function() {navClick($(this), jstable.last);});
	    
	    nextNavLinks.push(nextLink[0]);
	    nextNavLinks.push(lastLink[0]);
	    
	    row.append(rightNavTd);
	}
	
	return table;
    };

    var changeRowsPerPage = function(newValue) {
	var oldStartIndex = getStartIndex();
	rowsPerPage = newValue;
	currentPage = Math.floor(oldStartIndex / rowsPerPage) + 1;
	jstable.update();
    };

    var navClick = function(link, func) {
	if (link.hasClass("jstable-nav-link")) {
	    func();
	}
    };
    
    var createEditableSpan = function(value, onfinish) {
	var container = $('<span>');
	var span = $('<span title="click to change" style="padding: 0px 2px; font-weight: bold">');
	container.append(span);
	span.html(value);

	var input = $('<input type="text" class="jstable-editable-span">');
	container.append(input);
	
	var editing = false;
	input.hide();
	span.click(function() {
	    var oldVal = span.html();
	    input.show();
	    input.width((span.width() < 20 ? 20 : span.width()));
	    input.val(oldVal);
	    span.hide();
	    input.focus();
	    input.select();
	    editing = true;
	});

	var cancel = false;
	input.blur(function() {
	    if (editing) {
		editing = false;
		if (cancel) {
		    cancel = false;
		} else {
		    // set value to old value if onfinish returns false
		    var newVal = input.val();
		    if (onfinish(newVal)) {
			span.html(newVal);
		    }
		}

		input.hide();
		span.show();
	    }
	});
	
	input.keydown(function(event) {
	    var which = event.which;
		if (which === 27) { // esc
		    cancel = true;
		    $(this).blur();
		} else if (which === 13) { // enter
		    $(this).blur();
		    event.preventDefault();
		}
	    });
	
	// input esc and enter
	
	container.changeVal = function(newVal) {
	    span.html(newVal);
	};
	
	return container;
    };

    jstable.update = function() {
	if (onupdate) {
	    onupdate();
	}

	jstable.empty();
	jstable.updateNav();
	jstable.draw();
    };

    jstable.first = function() {
	currentPage = 1;
	jstable.update();
    };

    jstable.prev = function() {
	currentPage--;
	jstable.update();
    };

    jstable.next = function() {
	currentPage++;
	jstable.update();
    };

    jstable.last = function() {
	currentPage = numPages;
	jstable.update();
    };

    jstable.empty = function() {
	var start, end;
	var tableRows = html.children().children();
	if (pagination) {
	    start = 2;
	    end = tableRows.length - 1;
	} else {
	    start = 1;
	    end = tableRows.length;
	}

	for (var i=end-1; i>=start; i--) {
	    tableRows.eq(i).remove();
	}
    };

    jstable.updateNav = function() {
	if (pagination) {
	    numPages = Math.ceil(numFilRows / rowsPerPage);
	    sliders.slider({max: numPages, value: currentPage});
	    
	    // update the rows and page items
	    $.each(rowNavLowArray, function(i,v) {			
		       v.html(getStartIndex() + 1);
		   });
	    
	    $.each(rowNavHighArray, function(i,v) {
		       v.html(getEndIndex());
		   });
	    
	    $.each(rowNavTotalArray, function(i,v) {
		       v.html(numFilRows);
		   });
	    
	    $.each(pageNavArray, function(i,v) {
		       v.changeVal(currentPage);
		   });
	    
	    $.each(pageNavTotalArray, function(i,v) {
		       v.html(numPages);
		   });
	    
	    if (currentPage === 1) {
		// disable first and prev links
		prevNavLinks.removeClass('jstable-nav-link');
		prevNavLinks.addClass('jstable-nav-link-disabled');
	    } else {
		// enable first and prev links
		prevNavLinks.addClass("jstable-nav-link");
		prevNavLinks.removeClass("jstable-nav-link-disabled");
	    }

	    if (currentPage === numPages) {
		// disable next and last links
		nextNavLinks.removeClass("jstable-nav-link");
		nextNavLinks.addClass("jstable-nav-link-disabled");
	    } else {
		// enable next and last links
		nextNavLinks.addClass("jstable-nav-link");
		nextNavLinks.removeClass("jstable-nav-link-disabled");
	    }
	}
    };

    jstable.draw = function() {
	// assumes the table has already been emptied
	var newRows = $('');

	// find the start/end indices
	var start, end;
	if (pagination) {
	    start = getStartIndex();
	    end = getEndIndex();
	} else {
	    start = 0;
	    end = numFilRows;
	}

	for (var i=start; i<end; i++) {
	    var row = filRows[i];
	    var rowTr = $('<tr>');
	    newRows.push(rowTr[0]);
	    rowTr.addClass((i % 2 ? 'jstable-even-row' : 'jstable-odd-row'));
	    rowTr.hover(
		function() {
		    $(this).css({'background-color': 'lightgrey'});
		},
		function() {
		    $(this).css({'background-color': ''});
		}
	    );
	    for (var j=0; j<numCols; j++) {
		var cell = row.data[j];
		var cellTd = $('<td class="jstable-cell">');
		rowTr.append(cellTd);

		if (header[j].render) {
		    cellTd.append(header[j].render(cell.data));
		} else {
		    cellTd.html(cell.value);
		}
	    }
	};
	
	headRow.after(newRows);
    };

    var getStartIndex = function() {
	return (currentPage-1) * rowsPerPage;
    };
    
    var getEndIndex = function() {
	var low = getStartIndex();
	var numRowsRemaining = numFilRows - ((currentPage-1) * rowsPerPage);
	return low + (rowsPerPage > numRowsRemaining ? numRowsRemaining : rowsPerPage);
    };
    
    jstable.filter = function() {
	// determine current filters and if they've changed
	var changed = false;
	for (var i=0; i<numCols; i++) {
	    var head = header[i];
	    if (head.search) {
		var val = head.searchBox.val();
		if (val !== filters[i]) {
		    changed = true;
		    filters[i] = val;
		}
	    }
	}

	if (changed) {
	    // construct regexps
	    var regexps = [];
	    for (var i=0; i<numCols; i++) {
		if (filters[i] && (filters[i] !== '')) {
		    regexps[i] = new RegExp(filters[i], 'i');
		}
	    }

	    // now filter the rows
	    filRows = [];
	    for (var i=0; i<numRows; i++) {
		var row = rows[i];
		var match = true;
		for (var j=0; j<numCols; j++) {
		    var search = row.data[j].search;
		    if (regexps[j] && !regexps[j].test((search === undefined ? row.data[j].value : search))) {
			match = false;
			break;
		    }
		}

		if (match) {
		    filRows.push(row);
		}
	    }

	    numFilRows = filRows.length;
	    currentPage = 1;
	    jstable.update();
	}
    };

    jstable.getHeader = function() {
	return header;
    };

    jstable.getRows = function() {
	return rows;
    };
    
    var sortDownSrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAMAAABhq6zVAAAABGdBTUEAALGPC/xhBQAAAwBQTFRF\nAAAAMzMzmZmZ3t7e////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA06lu2gAAAQB0Uk5T////////////////////////\n////////////////////////////////////////////////////////////////////////////\n////////////////////////////////////////////////////////////////////////////\n////////////////////////////////////////////////////////////////////////////\n////////////////////////////////////////////////////////////////////////////\n////////////AFP3ByUAAAAJcEhZcwAADsEAAA7BAbiRa+0AAAAZdEVYdFNvZnR3YXJlAFBhaW50\nLk5FVCB2My41Ljg3O4BdAAAANUlEQVQYV33NMRIAIAgDQQL+/8sRAuPYaKrbKsZr9gHOaITHyoUj\n0aoulNRCSt0g1IM5e59uKN1n57FTgBsAAAAASUVORK5CYII=";
    var sortUpSrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAMAAABhq6zVAAAABGdBTUEAALGPC/xhBQAAAwBQTFRF\nAAAAMzMzmZmZ3t7e////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA06lu2gAAAQB0Uk5T////////////////////////\n////////////////////////////////////////////////////////////////////////////\n////////////////////////////////////////////////////////////////////////////\n////////////////////////////////////////////////////////////////////////////\n////////////////////////////////////////////////////////////////////////////\n////////////AFP3ByUAAAAJcEhZcwAADsEAAA7BAbiRa+0AAAAZdEVYdFNvZnR3YXJlAFBhaW50\nLk5FVCB2My41Ljg3O4BdAAAANElEQVQYV4XMwQoAIAwC0On2/79cSym6RJ58IMa4Eh8AGmgGUloA\nM6VG9yop3K3GiQ923pgsNGfntyvLpAAAAABJRU5ErkJggg==";

    return jstable;
    };

    return {
	create: create
    };
});
