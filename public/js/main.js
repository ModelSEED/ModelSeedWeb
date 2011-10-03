require(['/modules/Util/Util.js', '/modules/Header/Header.js', '/core/js/jquery.ba-hashchange.js'], function(util, header) {
    util.log.i('First visit!');
    var objects;

    // need to get the available options, found in /ojects/objects.json
    var success = function(objs) {
	objects = objs;
	$(window).hashchange(change);
	change(true);
    };

    var error = function(jqXHR, message) {
	util.log.e(message);
    };

    $.ajax({
	type: 'GET',
	url: '/objects/objects.json',
	dataType: 'json',
	success: success,
	error: error
    });

    var change = function(first) {
	if (first !== true) {
	    first = false;
	}

	var headerParams = {};
	if (first) {
	    // setup the header
	    headerParams.title = 'ModelSEEDWeb';
	    headerParams.links = 'Account | Settings | Help';
	}

	var hash = location.hash;

	var update = function(name) {
	    util.log.i('Change to hash: ' + name);
	    document.title = 'ModelSEEDWeb - ' + name;
	    headerParams.name = name;
	    if (first) {
		header.create(headerParams);
	    } else {
		header.update(headerParams);
	    }
	};

	if (hash.length <= 1) { // empty or just #
	    // homepage
	    update('Home');
	    $('#content').empty();
	    $('#content').append('Home');
	} else {
	    var info = hash.substr(1, hash.length - 1).split('/');
	    var object = info[0];
	    var id = info[1]; // might be undef, also check for empty string
	    if ($.type(id) === 'string' && id === '') {
		id = undefined;
	    }

	    // check for object
	    if ($.inArray(object, objects) >= 0) {
		update(object);

		// get object, should return cached item if it's already been loaded
		// confirm this though!
		require(['/objects/'+object+'/'+object+'.js'], function(obj) {
		    // empty content
		    $('#content').empty();

		    if ($.type(obj) === 'object') {
			if ($.isFunction(obj.change)) {
			    // call object.change with id (which might be undef)
			    obj.change(id);
			} else {
			    util.log.w('Object ' + object + ' has no change method!');
			}
		    } else {
			util.log.w('Object ' + object + ' did not return a js object!');
		    }
		});
	    } else {
		update('???');

		$('#content').empty();
		$('#content').append('No object: ' + object);
	    }
	}
    };
});

	// setup the 

	// load the object javascript file
//	require([object]);

	/* hash stuff should be in HashState
	var hash = location.hash;
	if (hash.length > 2) {
	    hash = hash.substr(2, hash.length - 2); // remove #/
	    var info = hash.split('?');

	    var id = info[0]; // might be undef
	    var paramstr = info[1]; // might be undef

	    // now load the object javascript file
	    require([object], function() {
		mainLoaded = true;
	    });
	} */
        // else {
	// no object, default page? or static page?
	// do we need to do anything here (thinking no)
