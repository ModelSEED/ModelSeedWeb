// Cache.js : simple cache behavior
// requires loader.js
define(['/js/lib/lzw.js', '/js/lib/json2.js'], function () {
    function cacheIsSupported () {
	if (window['noCache']) {
	    return false;
	}

        // need localStorage and webWorkers
        if(!window.Worker) {
            return false;
        }
        try {
            return 'localStorage' in window && window.localStorage !== null;
        } catch (e) {
            return false;
        } 
    }
    var compressor;
    function put(key, value) {
        if(!cacheIsSupported()) {
            return;
        }
        if(compressor === undefined) { 
            compressor = new Worker('/modules/Cache/js/compress.js');
            compressor.onmessage = function (event) {
                var key = event.data.key, value = event.data.value;
                try {
                    localStorage[key] = value;
                } catch(e) {}
            };
        }
        key = JSON.stringify(key);
        value = JSON.stringify(value);
        compressor.postMessage({key : key, value : value});
    }
    function getter(k, v, cb) {
        if(!cacheIsSupported()) {
            return;
        }
        var decompressor = new Worker('/modules/Cache/js/decompress.js');
            decompressor.onmessage = function(event) {
                cb({key: k, value: JSON.parse(event.data.value)});
            };
        decompressor.postMessage({key: k, value: localStorage[k]}); 
    }
        
    return {    
        get : function (key, cb) {
            key = JSON.stringify(key);
            if(localStorage.hasOwnProperty(key)) {
                getter(key, localStorage[key], cb);
                return true;
            } else {
                return false;
            }
        },
        set : function (key, value) {
            return put(key,value); 
        },
        supported : function () {
            return cacheIsSupported();
        }
    }; 
});
