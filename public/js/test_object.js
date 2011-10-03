
require(['/modules/Util/Util.js', '/modules/ModelDB/ModelDB.js'], function(util, modelDB) {
    util.log.debug(true);
    util.log.d('Modules loaded, attempting to create new ModelDB');

    $('#content').empty();

    modelDB.create();
    util.log.d('ModelDB created!');

    /*
    modelDB.get_table({
	table: 'reaction'
    }, function(reactions) {
	util.log.d('Got reaction table!');
	util.log.d(reactions.iterator().next());
    });
    */

    window.Util = util;
});
