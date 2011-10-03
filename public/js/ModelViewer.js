
require(['/js/modules/Util.js', '/js/modules/Header.js', '/js/modules/ModelDB.js', '/js/compound.js', '/js/complex.js'], function(util, header, modelDB, compound, complex) {
    util.log.debug(true);
    util.log.d('ModelViewer running');

    // create modeldb
    modelDB.create();

    // test the header
    header.create({
	title: 'ModelSEED',
	name: 'ModelViewer',
	links: 'Account | Settings | Help'
    });

    // tell the components to load their data, progress bar (in header?) to show progress
    compound.loadData();
    complex.loadData();
});
