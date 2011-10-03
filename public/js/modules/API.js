// API.js : implement wrapper around web APIs
// Usage:
// var myAPI = API.create({url : "http://apis.theseed.org/myAPI"});
// myAPI.ready(function () {
//     myAPI.method(arguments, callback);
// });
// 
// OR, anonomously
// 
// API.create({url : "http://apis.theseed.org/myAPI"}).ready(function (api) {});

/**
 * <p>Wrapper around web APIs</p>
 *
 *
 * @name API
 * @namespace
 *
 */
define(['js/lib/json2.js'], function () {
    function _query(db, fn, args, cb) {
        var data = "db=" + db + "&function=" + fn + "&encoding=json&args=" + JSON.stringify(args);
        var settings = {
            url : '/api',
            data : data,
            dataType : 'json',
            type : 'POST',
            error : function (d) {
//                console.log(d);
            }
        };
        if(cb) {
            settings.success = cb;
        }
        $.ajax(settings);
    }
    function make_method(method, that) {
        that[method] = function(args, cb) {
            _query(that._db, method, args, cb, that._caching || false);
        };
    }
    function _init_methods(that) {
        that.ready = function (cb) {
            that._callback = cb;
            if(that.isReady) {
                cb(that);
            }
        };
        _query(that._db, 'methods', {}, function (methods) {
            var method, i;
            for(i=0;i<methods.length; i++) {
                    make_method(methods[i], that);
            }
	    if (++that._loaded === that._queue) {
		if(that._callback) {
		    that._callback(that);
		}
		that.isReady = true;
            }
        });
    }
    return {
       create : function (args) {
            var that = { _db : args.db, _queue : 1, _loaded : 0};
            if(args.caching === true) {
                that._caching = true;
		that._queue++;
		require(['/modules/Cache/Cache.js'], function() {
		    if (++that._loaded === that._queue) {
			if (that._callback) {
			    that._callback(that);
			}
			that.isReady = true;
		    }
		});
            }
            _init_methods(that); 
            return that;
        }
    };
});
