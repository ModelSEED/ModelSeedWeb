
define(['/js/modules/Util.js', '/js/modules/API.js', '/js/lib/json2.js'], function (util, api) {
    util.log.debug(true);
    var methods = {};

    methods.get_object = {
	params: {
	    type:  { type: 'string', optional: false },
	    query: { type: 'object', optional: true  }
	},
	callback: function(params, response) {
	    return response;
	}
    };

    methods.get_objects = {
	params: {
	    type:  { type: 'string', optional: false },
	    query: { type: 'object', optional: true  }
	},
	callback: function(params, response) {
	    return response;
	}
    };

    methods.get_table = {
	params: {
	    table:   { type: 'string', optional: false },
	    columns: { type: 'array',  optional: true  },
	    indexes: { type: 'array',  optional: true  },
	    query:   { type: 'object', optional: true  }
	},
	callback: function(params, response) {
	    if (response && response[1].length > 0) {
		var modelDB = {
		    columns: response[0],
		    _rows: response[1]
		};

		// find indexes
		var inds = [];
		modelDB._indexes = {};
		if (params.indexes) {
		    for (var i=0,ii=params.indexes.length; i<ii; i++) {
			var col = params.indexes[i];
			var ind = $.inArray(col, modelDB.columns);
			if (ind >= 0) {
			    inds[ind] = true;
			    modelDB._indexes[col] = {};
			} else {
			    // warn not a column
			}
		    }

		    // loop over rows to index
		    for (var i=0,ii=modelDB._rows.length; i<ii; i++) {
			var row = modelDB._rows[i];
			for (var j=0; j<modelDB.columns.length; j++) {
			    if (inds[j]) {
				modelDB._indexes[modelDB.columns[j]][row[j]] = row;
			    }
			}
		    }
		}

		modelDB._createObject = function(row) {
		    var obj = {};
		    for (var i=0; i<this.columns.length; i++) {
			obj[this.columns[i]] = row[i];
		    }

		    return obj;
		};

		modelDB.iterator = function() {
		    var i=0;
		    var end=this._rows.length;
		    var hasNext = true;
		    var mdb = this;

		    return {
			hasNext: function() {
			    return hasNext;
			},
			next: function() {
			    var obj = mdb._createObject(mdb._rows[i]);
			    if (++i === end) {
				hasNext = false;
			    }

			    return obj;
			}
		    };
		};

		modelDB.get = function(index, key) {
		    if (!this._indexes[index]) {
//			console.log('Warning: column ' + index + ' isn\'t indexed.');
			return null;
		    }

		    var row = this._indexes[index][key];
		    if (row) {
			return this._createObject(row);
		    } else {
			return null;
		    }
		};

		modelDB.joinOnIndex = function(index, mdbToJoin, colToJoin, colMapping) {
		    if (!this._indexes[index]) {
//			console.log('Warning: column ' + index + ' isn\'t indexed.');
			return;
		    }

		    var numCols = this.columns.length;
		    var newCols = [];
		    for (var i=0,ii=mdbToJoin.columns.length; i<ii; i++) {
			var column = mdbToJoin.columns[i];

			if (column !== colToJoin) {
			    if (colMapping) {
				if (colMapping[column]) {
				    newCols.push(column);
				    this.columns.push(colMapping[column]);
				}
			    } else {
				newCols.push(column);
				this.columns.push(column);
			    }
			}
		    }

		    for (var i=0,ii=this._rows.length; i<ii; i++) {
			var row = this._rows[i];
			for (var j=0,jj=newCols.length; j<jj; j++) {
			    row.push([]);
			}
		    }

		    for (var it=mdbToJoin.iterator(); it.hasNext(); ) {
			var obj = it.next();

			var row = this._indexes[index][obj[colToJoin]];
			if (row) {
			    for (var i=0,ii=newCols.length; i<ii; i++) {
				row[i+numCols].push(obj[newCols[i]]);
			    }
			} else {
			    // warn no object with id: obj[colToJoin]
			}
		    }
		};

		return modelDB;
	    } else {
		// no objects
		return null;
	    }
	}
    };

    var queue = [];
    var readyQueue = [];

    var ModelDB = {};

    var msApi;
    ModelDB.create = function() {
	util.log.d('creating ModelDB api');
	msApi = api.create({db: 'ModelDB_server.cgi'});

	// provide callback queue in case msApi isn't ready by the time get_object(s) is called
	msApi.ready(function() {
	    util.log.d('ModelDB ready');
	    if (readyQueue.length > 0) {
		for (var i=0,ii=readyQueue.length; i<ii; i++) {
		    readyQueue[i]();
		}
	    }
	});
    };

    $.each(methods, function(name, method) {
	ModelDB[name] = function(params, callback) {
	    util.log.d('server call: ' + name + ' with params: ' + JSON.stringify(params) + ' started');
	    var cb = function(results) {
		util.log.d('server call: ' + name + ' with params: ' + JSON.stringify(params) + ' completed');
		callback(results);
	    };
	    var serverCall = createServerCall(name, params, cb);
	    runQueue([serverCall]);
	};
    });

    ModelDB.enqueue = function(method, params, callback) {
	var serverCall = createServerCall(method, params, callback);
	queue.push(serverCall);
    };

    ModelDB.execute = function() {
	runQueue(queue);
    };

    var createServerCall = function(methodName, params, callback) {
	var method = methods[methodName];
	if (method) {
	    // check params

	    var cb = function(data) {
		var formattedData = method.callback(params, data);

		if (callback && $.isFunction(callback)) {
		    callback(formattedData);
		}
	    };

	    return {
		method: methodName,
		params: params,
		callback: cb
	    };

	} else {
	    // warn no method with that name
	    return null;
	}
    };

    var runQueue = function(queueToRun) {
	var newQueue = queueToRun.splice(0, queueToRun.length); // this empties queueToRun into newQueue
	var func = function() {
	    msApi.run_queue({queue: newQueue}, function(responses) {
		for (var i=0,ii=responses.length; i<ii; i++) {
		    // check if successful
		    var response = responses[i];
		    if (response.success === 'true' && response.failure === 'false') {
			newQueue[i].callback(response.response);
		    } else {
			// failed, log error
		    }
		}
	    });
	};

	// check if msApi is ready
	if (msApi._loaded) {
	    func();
	} else {
	    readyQueue.push(func);
	}
    };

    return ModelDB;
});