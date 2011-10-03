
define(['/js/modules/Util.js', '/js/lib/jquery.ba-hashchange.js', '/js/lib/json2.js'], function(util) {
    // hashchange introduces hashchange event for older browsers

    var defaultState = null;
    var currentState = null;
    var handleChange = null;
    var hashChangeEvents = {};
    var hashUnchangeEvents = {};

    var hashChange = {
	/* options: name - state name
	 *          onchange - function to call when changing TO this state
	 *          onunchange - optional: function to call when changing FROM this state
	 *          isdefault - optional: this state should be called when hash string is empty
	 */
	register: function(params) {
	    if (hashChangeEvents[params.name]) {
		// state with 'name' already exists
		util.log.w('Could not register state \'' + params.name + '\', name already registered');
	    } else {
		if (params.onchange && $.isFunction(params.onchange)) {
		    hashChangeEvents[params.name] = params.onchange;

		    if (params.isdefault) {
			if (defaultState !== null) {
			    util.log.w('Overriding default state \'' + defaultState + '\' with state \'' + params.name + '\'');
			}

			defaultState = params.name;
		    }
		} else {
		    util.log.w('Could not register state \'' + name + '\', must provide a callback function');
		}

		if (params.onunchange && $.isFunction(params.onunchange)) {
		    hashUnchangeEvents[params.name] = params.onunchange;
		}
	    }
	},
	unregister: function(name) {
	    if (hashChangeEvents[name]) {
		delete hashChangeEvents[name];

		if (hashUnchangeEvents[name]) {
		    delete hashUnchangeEvents[name];
		}
	    } else {
		util.log.w('Could not unregister state \'' + name + '\', state with that name not registered');
	    }
	},
	changeState: function(state, params) {
	    if ($.type(state) === 'string') {
		var hash = '#' + state;

		if ($.type(params) === 'object') {
		    var paramarr = [];
		    $.each(params, function(key, value) {
			if ($.type(value) === 'string') {
			    paramarr.push(key + '=' + value);
			}
		    });

		    if (paramarr.length > 0) {
			hash += ':' + paramarr.join('&');
		    }
		}

		location.hash = hash;
	    }
	},
	trigger: function() {
	    $(window).hashchange();
	},
	handleChange: function(func) {
	    if (func && $.isFunction(func)) {
		handleChange = func;
	    } else {
		util.log.w('Could not set change handling, need to supply a function');
	    }
	}
    };

    $(window).hashchange(function() {
	var hashInfo = parseHash();

	if (hashInfo.state === '') {
	    if (defaultState) {
		hashInfo.state = defaultState;
	    } else {
		return;
	    }
	}

	util.log.d('HashChangeEvent - State: ' + hashInfo.state + ' Params: ' + JSON.stringify(hashInfo.params));

	var change = hashChangeEvents[hashInfo.state];
	if (change) {
	    if (currentState !== null) {
		var unchange = hashUnchangeEvents[currentState];
		if (unchange) {
		    unchange();
		}
	    }
	
	    var result = change(hashInfo.params);
	    if (handleChange) {
		handleChange(result);
	    }

	    currentState = hashInfo.state;
	} else {
	    util.log.w('State \'' + hashInfo.state + '\' not registered');
	}
    });

    var parseHash = function() {
	var hash = location.hash;
	if (hash.length > 1) {
	    hash = hash.substr(1, hash.length - 1); // remove #
	    var info = hash.split(':');
	    var state = info[0];

	    // parse parameters
	    var paramstr = info[1];
	    var params = {};
	    if (paramstr) {
		var paramarr = paramstr.split('&');
		for (var i=0,ii=paramarr.length; i<ii; i++) {
		    var keyval = paramarr[i].split('=');
		    if (keyval.length === 2) {
			params[keyval[0]] = keyval[1];
		    }
		}
	    }

	    return {state: state, params: params};
	} else {
	    return {state: '', params: {}};
	}
    };

    return hashChange;
});