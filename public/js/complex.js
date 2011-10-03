
define(['/js/modules/Util.js', '/js/modules/ModelDB.js'], function(util, modelDB) {
    util.log.debug(true);
    util.log.d('complex.js started');

    var complex = {};

    var cpxTable;

    complex.loadData = function() {
	modelDB.get_table({
	    table: 'complex',
	    indexes: ['id']
	}, function(table) {
//	    cpxTable = table;
	    window.cpxTable = table;
	});
    };

    return complex;
});