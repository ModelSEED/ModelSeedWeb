/**
 * <p>Utility module that contains useful functions</p>
 *
 *
 * @name Util
 * @namespace
 *
 */

// define(['Html/jquery-ui.min.js', 'Html/stacktrace-0.3.js'], function() {
define(['js/lib/jquery-ui.js'], function() {
    /**
     * <p>Import a css file, if the file hasn't been imported already</p>
     * <p>Works by inserting a link tag into the head section</p>
     *
     * @methodOf Util
     * @param {string} href Url of css file to import
     * @returns {boolean} True if the link was inserted, false if the link already existed
     * @name addCSS
     */
    var addCSS = function(href) {
	if ( $('head link[href*="' + href + '"]').length === 0 ) {
	    $('head').append('<link rel="stylesheet" type="text/css" href="' + href + '" />');
	    return true;
	} else {
	    return false;
	}
    };

    addCSS('/css/jquery-ui.css'); // used in log

    /**
     * Handles history
     *
     * @fieldOf Util
     * @name history
     * @namespace
     */
    var history = function() {
	var that = {};

	if (window.history && window.history.pushState) {
	    // has HTML5 history support
	    that.html5 = true;
	} else {
	    // no HTML5 history support :(
	    that.html5 = false;
	    log.i('Using an older browser with no html5 history support');
	}

	

	return that;
    }();

    /**
     * Logger
     *
     * @fieldOf Util
     * @name log
     * @namespace
     */
    var log = {
	_debug: false,
	_win: null,
	_console: ((window['console'] && $.isFunction(window['console'].log)) ? null : []),
	_data: [],
	/**
	 * <p>Log a debug message, if debug flag set to true</p>
	 *
	 * @methodOf Util.log
	 * @param {string} message Message to log
	 * @name d
	 */
	d: function(message) { // debug
	    if (this._debug) {
		logger(message, 'd');
	    }
	},
	/**
	 * <p>Log an info message</p>
	 *
	 * @methodOf Util.log
	 * @param {string} message Message to log
	 * @name i
	 */
	i: function(message) { // info
	    logger(message, 'i');
	},
	/**
	 * <p>Log a warning message</p>
	 *
	 * @methodOf Util.log
	 * @param {string} message Message to log
	 * @name w
	 */
	w: function(message) { // warn
	    logger(message, 'w');
	},
	/**
	 * <p>Log an error message and display a dialog</p>
	 *
	 * @methodOf Util.log
	 * @param {string} message Message to log
	 * @name e
	 */
	e: function(message, uncaught) { // error, uncaught set to true when coming from window.onerror
	    logger(message, 'e');
	    errorPopup(message, uncaught);
	},
	/**
	 * <p>Switch debugging on or off</p>
	 *
	 * @methodOf Util.log
	 * @param {boolean} flag Boolean flag turning debugging on/off
	 * @name debug
	 */
	debug: function(flag) {
	    if ($.type(flag) === 'boolean') {
		if (flag !== this._debug) {
		    this._debug = flag;
		    if (this._console) {
			if (flag) {
			    log.showConsole = showConsole;
			} else {
			    delete log.showConsole;
			}
		    }
		}
	    }
	}
    };

    // method to open custom console if no built-in console
    var showConsole;
    if (log._console) {
	showConsole = function() {
	    if (log._win === null || log._win.closed) {
    		log._win = window.open('', '_blank', 'location=no,menubar=no,height=400,width=600');
		log._win.document.writeln('<html><head><title>Console</title></head><body style="background-color: black;"><div id="body"></div></body></html>');

		var body = log._win.document.getElementById('body');
		for (var i=0,ii=log._console.length; i<ii; i++) {
		    var span = createMessage(log._win.document, log._console[i]);
		    body.appendChild(span);
		    body.appendChild(log._win.document.createElement('br'));
		}
	    } else {
		log._win.focus();
	    }
	};
    }

    // internal logging helper function
    var logger = function(message, type) {
//	var trace = printStackTrace();
	var trace = [];
	log._data.push([type, message, trace]);

	// add to console
	if (log._console) {
	    // use custom console
	    var color;

	    if (type === 'd') {
		color = 'white';
	    } else if (type === 'i') {
		color = 'green';
	    } else if (type === 'w') {
		color = 'yellow';
	    } else if (type === 'e') {
		color = 'red';
	    }

	    log._console.push([message, color]);

	    if (log._win !== null && !log._win.closed) {
		var document = log._win.document;
		var span = createMessage(document, [message, color]);
		document.getElementById('body').appendChild(span);
		document.getElementById('body').appendChild(document.createElement('br'));
	    }

	} else {
	    // use built-in console
	    var logged = false;
	    if (type === 'd') {
		if ($.isFunction(console.debug)) {
		    console.debug(message);
		    logged = true;
		}
	    } else if (type === 'i') {
		if ($.isFunction(console.info)) {
		    console.info(message);
		    logged = true;
		}
	    } else if (type === 'w') {
		if ($.isFunction(console.warn)) {
		    console.warn(message);
		    logged = true;
		}
	    } else if (type === 'e') {
		if ($.isFunction(console.error)) {
		    console.error(message);
		    logged = true;
		}
	    }

	    if (!logged) {
		console.log(message);
	    }
	}
    };

    var createMessage = function(document, info) {
	var message = info[0];
	var color = info[1];

	var span = document.createElement('span');
	span.style.fontSize = '0.8em';
	span.style.fontFamily = '"Courier New", monospace';
	span.style.color = color;
	span.appendChild(document.createTextNode(message));

	return span;
    };

    window.onerror = function(message, url, line) {
	if (url && line) {
	    message += '<br />at ' + url + ' line: ' + line;
	}

	log.e(message, true);

	// do some browser specific stuff here to make sure error doesn't show up twice in console
	// namely, the webkit browsers (chrome and safari) must return false, while firefox must return true
	// of course, IE logs error no matter what...
	if(navigator.userAgent.toLowerCase().indexOf('webkit') > -1) {
	    return false;
	} else {
	    return true;
	}
    };

    var errorPopup = function(message, uncaught) {
	var dialog = $('<div>');
	if (uncaught) {
	    dialog.append('Encountered an unknown error<br />');
	} else {
	    dialog.append('Encountered an error<br />');
	}

	dialog.append('<span style="padding-left: 10px; font-family: \'Courier New\', monospace">' + message + '</span>');

	var buttons = {};
	if (log._debug) {
	    if (log._console) {
		buttons['Open Console'] = function() {
		    $(this).dialog('close');
		    log.showConsole();
		};
	    }
	} else {
	    buttons['Report Error'] = function() {
		$(this).dialog('close');
	    };
	}

	buttons['Close'] = function() {
	    $(this).dialog('close');
	};

	dialog.dialog({
	    resizable: false,
	    modal: true,
	    buttons: buttons
	});
    };


    return {
	addCSS: addCSS,
	history: history,
	log: log
    };
});