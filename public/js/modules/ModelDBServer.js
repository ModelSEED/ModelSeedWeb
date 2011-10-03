// ModelDBServer.js a simple interface into the ModelDBServer
// requires loader.js

var modelDb;
define(['/js/modules/Cache.js', 'js/lib/json2.js'], function (Cache) {
    var address = 'ModelDB_server.cgi'; //FIG_Config['cgi_base'] + '/ModelDBServer.cgi';
    var _init_object = function (data, type) {
        function DataObject(data, type) {
            this._db = modelDb;
            this._type = type;
            this._attr = data;
            this.attributes = function () { 
                var keys = [];
                var key;
                for (key in this._attr) {
                    if(this._attr.hasOwnProperty(key)) {
                        keys.push(key);
                    }
                }
                return keys;
            };
            var key;
            for (key in data) {
                if (data.hasOwnProperty(key)) {
                    this.__defineGetter__(key, function(k){ return function () {return this._attr[k]};}(key));
                    this.__defineSetter__(key, function (k){
                        return function (val) {
                            this._attr[k] = val;
                                _call_fn_args('set_attribute', { 'key' : k, 'value' : val,
                                    'type' : this._type, 'object' : { '_id' : this._attr['_id'] }});
                                return this._attr[k];
                   };
                   }(key));
                }
            }
        }
        return new DataObject(data, type);
    };
    var _call_fn_args = function (f, args, cb) {
        var data = "function=" + f + "&encoding=json&args=" + JSON.stringify(args);
        var settings = {
            url : address,
            data : data,
            dataType: 'json',
            type : 'POST',
            error : function (d) {
                console.log(d);
            }
        };
        if(cb) {
            settings.success = function (data) {
                if(data.success == 'true' && data.failure == 'false') {
                    cb(data.response);
                } else {
                    console.log(data.msg); 
                }
            };
        }
        $.ajax(settings);
    };
    return {
    
        get_object : function (type, query, cb) {
            var all_query = { 'type' : type, 'query' : query || {}};
            var cached = Cache.get(all_query, function (data) {
                var obj = _init_object(data.value, type);
                cb(obj);
            });
            if(cached) {
                return;
            }
            _call_fn_args('get_object', all_query,
                function (data) {
                    Cache.set(all_query, data);
                    var obj = _init_object(data, type);
                    if(cb) {
                        cb(obj);
                    }
                });
        },
        get_objects : function (type, query, cb) {
            var all_query = { 'type' : type, 'query' : query || {}};
            var cached = Cache.get(all_query, function (data) {
                var arr = [], i; 
                for(i=0; i<data.value.length; i++) {
                    arr.push(_init_object(data.value[i], type));
                }
                cb(arr);
            });
            if(cached) {
                return;
            }
            _call_fn_args('get_objects', all_query,
                function (data) {
                    var arr = [], i;
                    Cache.set(all_query, data);
                    for(i=0; i<data.length; i++) {
                        arr.push(_init_object(data[i], type));
                    }
                    if(cb) {
                        cb(arr);
                    }
                });
        },
        watch_objects : function (type, query, cb) {
            var all_query = { 'type' : type, 'query' : query || {}};
            var cached = Cache.get(all_query);
            if(cached) {
                var arr = [], i; 
                for(i=0; i<cached.length; i++) {
                    arr.push(_init_object(cached[i], type));
                }
                cb(arr);
            }
            _call_fn_args('get_objects', all_query,
                function (data) {
                    var arr = [], i;
                    if(cached && cached != JSON.stringify(data)) {
                        Cache.set(all_query, data);
                        for(i=0; i<data.length; i++) {
                            arr.push(_init_object(data[i], type));
                        }
                        if(cb) {
                            cb(arr);
                        }
                    }
               });
        },
        
        create_object : function (type, obj, cb) {
            _call_fn_args('create_object', { 'type' : type, 'object' : obj}, cb);
        }
    };
});
