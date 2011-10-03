
define(['/js/modules/Util.js', '/js/modules/ModelDB.js'], function(util, modelDB) {
    util.log.debug(true);
    util.log.d('compound.js started');

    var compound = {};

    var cpdTable;

    compound.loadData = function() {
	modelDB.get_table({
	    table: 'compound',
	    indexes: ['id']
	}, function(table) {
//	    cpdTable = table;
	    window.cpdTable = table;
	});
    };
    
    return compound;
});