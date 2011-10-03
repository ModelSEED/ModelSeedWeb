
require(['ModelDB', 'JSTable', 'jquery.ba-hashchange'], function(modelDB, jstable) {
    require.ready(function() {
	var admin = false;
	var seedviewerUrl = '';
	var container;
	var edit = false;

	// data vars
	var dataLoaded = -1; // -1: not loaded, 0: loading, 1: loaded
	var allComplexTable, addRoleDialog, addReactionDialog;
	msdata = {};

	var run = function() {
	    container = $('#container');

	    var cv = window['ComplexViewer'];
	    if (!cv) {
		// error!
		return;
	    }

	    admin = (cv.admin ? true : false);
	    seedviewerUrl = cv.seedviewerUrl;

	    modelDB.create(cv.dbUrl);

	    // check for state via hashtag
	    $(window).hashchange(changeState);
	    changeState();
	};
	     
	var changeState = function() {
	    if (dataLoaded === -1) {
		// need to load data
		loadAllData();
	    } else if (dataLoaded === 1) {
		var hash = location.hash;
		hash = hash.substr(1, hash.length - 1);
//		console.log('Hash change event, new hash = "' + hash + '"');

		var states = hash.split('&');
		var params = {};
		for (var i=0,ii=states.length; i<ii; i++) {
		    var keyval = states[i].split('=');
		    if (keyval.length === 2) {
			params[keyval[0]] = keyval[1];
		    }
		}

		allComplexTable.detach();
		container.empty();
		if ($.type(params.complex) !== 'undefined') {
		    // request for a single complex
		    container.append(displayComplex(params.complex));
		} else {
		    container.append(allComplexTable);
		}
	    } else {
		// data being loaded now
		return;
	    }
	};

	var displayComplex = function(complex) {
	    var complexObj = msdata.complex.get('id', complex);

	    if (complexObj) {
		var info = $('<div>');

		info.append('<p>'+complexObj.id+'</p>');

		var roleInfo = $('<p>RoleInfo </p>');
		if (edit) {
		    var newRole = $('<a href="javascript:void(0)">(add)</a>');
		    newRole.click(function() {
			addRoleDialog.dialog('open');
		    });
		    roleInfo.append(newRole);
		}

		info.append(roleInfo);
		info.append(getRoleTable(complexObj.roles));

		var reactionInfo = $('<p>ReactionInfo </p>');
		if (edit) {
		    var newReaction = $('<a href="javascript:void(0)">(add)</a>');
		    newReaction.click(function() {
			addReactionDialog.dialog('open');
		    });
		    reactionInfo.append(newReaction);
		}

		info.append(reactionInfo);
		info.append(getReactionTable(complexObj.reactions));

		return info;
	    } else {
		return 'No complex with that id.';
	    }
	};

	var getRoleTable = function(roles) {
	    // header
	    var header = ['Name', 'Subsystem', 'SS Class 1', 'SS Class 2', 'Exemplar Gene'];
	    if (edit) {
		header.push({value: 'Control', render: function(role) {
		    var html = $('<a href="javascript:void(0)">remove</a>');
		    html.click(function() {
			var dialog = $('<span>');
			dialog.append('Are you sure you want to remove role ' + role.name + ' from this complex?');
			dialog.dialog({
			    resizable: false,
			    modal: true,
			    buttons: {
				'Remove': function() {
				    $(this).dialog('close');
				},
				'Cancel': function() {
				    $(this).dialog('close');
				}
			    }
			});
		    });

		    return html;
		}});
	    }

	    // rows
	    var rows = [];
	    for (var i=0,ii=roles.length; i<ii; i++) {
		var role = msdata.role.get('id', roles[i]);
		var row = createRoleRow(role);
		if (edit) {
		    // create remove button
		    row.push({data: {id: role.id, name: role.name}});
		}
		rows.push(row);
	    }

	    // options
	    var options = {pagination: false};

	    // create the table
	    var roleTable = jstable.create(header, rows, options);

	    return roleTable.getHtml();
	};

	var getReactionTable = function(reactions) {
	    // id, name, equation, complexes, roles, keggmaps, enzyme, keggids
	    var header = ['Reaction Id', 'Name', 'Equation', 'Complexes', 'Roles', 'Kegg Maps', 'Enzyme', 'Kegg Ids'];
	    if (edit) {
		header.push({value: 'Control', render: function(reactionId) {
		    var html = $('<a href="javascript:void(0)">remove</a>');
		    html.click(function() {
			var dialog = $('<span>');
			dialog.append('Are you sure you want to remove reaction ' + reactionId + ' from this complex?');
			dialog.dialog({
			    resizable: false,
			    modal: true,
			    buttons: {
				'Remove': function() {
				    $(this).dialog('close');
				},
				'Cancel': function() {
				    $(this).dialog('close');
				}
			    }
			});
		    });

		    return html;
		}});
	    }

	    // rows
	    var rows = [];
	    for (var i=0,ii=reactions.length; i<ii; i++) {
		var reaction = msdata.reaction.get('id', reactions[i]);

		/*
		// construct equation
		var left = reaction.equation[0];
		var rev = reaction.equation[1];
		var right = reaction.equation[2];

		var leftCpds = [];
		$.each(left, function(i,v) {
		    // v = [id, name, stoich]
		    var info = '';
		    if (v[2] != null) {
			info += '(' + v[2] + ') ';
		    }
		    info += createCompoundLink(v[0], v[1]);

		    leftCpds.push(info);
		});

		var rightCpds = [];
		$.each(right, function(i,v) {
		    // v = [id, name, stoich]
		    var info = '';
		    if (v[2] != null) {
			info += '(' + v[2] + ') ';
		    }
		    info += createCompoundLink(v[0], v[1]);

		    rightCpds.push(info);
		});

		var equation = leftCpds.join(' + ') + ' ' + rev + ' ' + rightCpds.join(' + ');

		 */

		var row = createReactionRow(reaction);
		if (edit) {
		    row.push({data: reaction.id});
		}

		rows.push(row);
	    }

	    // options
	    var options = {pagination: false};

	    // create the table
	    rxnTable = jstable.create(header, rows, options);

	    return rxnTable.getHtml();
	};

	var createRoleRow = function(role, search) {
	    var subsystems = role.subsystems;
	    var ss = {ss: [], sslinks: [], ssc1: [], ssc2: []};
	    if (subsystems.length > 0) {
		// get the subsystems
		for (var i=0,ii=subsystems.length; i<ii; i++) {
		    var sub = msdata.subsystem.get('id', subsystems[i]);
		    if (sub) {
			ss.ss.push(sub.name);
			ss.sslinks.push(createSubsystemLink(sub.name));
			ss.ssc1.push(sub.classOne);
			ss.ssc2.push(sub.classTwo);
		    }
		}
	    }

	    if (ss.ss.length === 0) {
		ss.ss.push('none');
	    }
	    
	    var row;
	    if (search) {
		row = [role.name, {value: ss.sslinks.join('<br />'), search: ss.ss.join(' '), sort: ss.ss.join(' ')}, ss.ssc1.join('<br />'), ss.ssc2.join('<br />'), role.exemplarid];
	    } else {
		row = [role.name, ss.sslinks.join('<br />'), ss.ssc1.join('<br />'), ss.ssc2.join('<br />'), role.exemplarid];
	    }

	    return row;
	};

	var createReactionRow = function(reaction, search) {
	    // id, name, equation, complexes, roles, keggmaps, enzyme, keggids
	    var equation = reaction.equation;

	    // get complexes and roles
	    var complexes = reaction.complexes;
	    var cpxs = [];
	    var roles = [];
	    for (var i=0,ii=complexes.length; i<ii; i++) {
		var cpxId = complexes[i];
		cpxs.push(cpxId);

		var roleIds = msdata.complex.get('id', cpxId).roles;
		for (var j=0,jj=roleIds.length; j<jj; j++) {
		    roles.push(msdata.role.get('id', roleIds[j]).name);
		}
	    }

	    // get keggmaps
	    var keggmaps = reaction.keggmaps;
	    var maps = [];
	    for (var i=0,ii=keggmaps.length; i<ii; i++) {
		var map = msdata.diagram.get('id', keggmaps[i]);
		maps.push(map.altid + ' ' + map.name);
	    }

	    var row;
	    if (search) {
		
	    } else {
		row = [createReactionLink(reaction.id), reaction.name, equation, cpxs.join('<br />'), roles.join('<br />'), keggmaps.join('<br />'), reaction.enzyme, reaction.keggids.join('<br />')];
	    }

	    return row;
	};

	var loadAllData = function() {
	    dataLoaded = 0;

	    // display progress bar in dialog
	    var dialog = $('<div style="text-align: center;">');

	    var progress = $('<div>');
	    progress.progress = 0;
	    dialog.append(progress);
	    dialog.append('Loading...');

	    progress.progressbar({
		value: 0
	    });

	    dialog.dialog({
		modal: true,
		resizable: false,
		closeOnEscape: false,
		open: function() {
		    $(".ui-dialog-titlebar-close").hide();
		}
	    });

	    var dataToLoad = [
		{table: 'complex',   query: {},                       indexes: ['id'], columns: ['id']},
		{table: 'role',      query: {},                       indexes: ['id'], columns: ['id', 'name', 'exemplarid']},
		{table: 'subsystem', query: {},                       indexes: ['id'], columns: ['id', 'name', 'status', 'classOne', 'classTwo']},
		{table: 'reaction',  query: {},                       indexes: ['id'], columns: ['id', 'name', 'equation', 'reversibility', 'enzyme']},
		{table: 'compound',  query: {},                       indexes: ['id'], columns: ['id', 'name']},
		{table: 'diagram',   query: {type: 'KEGG'},           indexes: ['id'], columns: ['id', 'name', 'altid']},
		{table: 'cpxrole',   query: {},                                        columns: ['ROLE', 'COMPLEX']},
		{table: 'rxncpx',    query: {},                                        columns: ['REACTION', 'COMPLEX']},
		{table: 'ssroles',   query: {},                                        columns: ['SUBSYSTEM', 'ROLE']},
		{table: 'dgmobj',    query: {entitytype: 'reaction'},                  columns: ['DIAGRAM', 'entity']},
		{table: 'rxnals',    query: {type: 'KEGG'},                            columns: ['REACTION', 'alias']}
	    ];

	    progress.total = 3;

	    var numLoaded = 0;
	    var numToLoad = dataToLoad.length;
	    $.each(dataToLoad, function(i, param) {
		var time = new Date().getTime();
		modelDB.enqueue('get_table', param, function(data) {
//		    console.log('got ' + param.table + ' table in ' + (new Date().getTime() - time) + ' ms');
		    msdata[param.table] = data;

		    if (++numLoaded === numToLoad) {
			loadAllDataCallback(progress, dialog);
		    }
		});
	    });

	    modelDB.execute();
	    progress.progressbar('value', (++progress.progress / progress.total) * 100);
	};

	var loadAllDataCallback = function(progress, dialog) {
	    // do some joins
	    msdata.complex.joinOnIndex('id', msdata.cpxrole, 'COMPLEX', {ROLE: 'roles'});
	    msdata.complex.joinOnIndex('id', msdata.rxncpx, 'COMPLEX', {REACTION: 'reactions'});

	    msdata.role.joinOnIndex('id', msdata.ssroles, 'ROLE', {SUBSYSTEM: 'subsystems'});

	    msdata.reaction.joinOnIndex('id', msdata.rxncpx, 'REACTION', {COMPLEX: 'complexes'});
	    msdata.reaction.joinOnIndex('id', msdata.rxnals, 'REACTION', {alias: 'keggids'});
	    msdata.reaction.joinOnIndex('id', msdata.dgmobj, 'entity', {DIAGRAM: 'keggmaps'});

	    allComplexTable = createAllComplexTable();

	    if (admin) {
		addRoleDialog = createAddRoleDialog();
		addReactionDialog = createAddReactionDialog();

		edit = true;
	    }
	    dataLoaded = 1;
	    changeState();

	    progress.progressbar('value', (++progress.progress / progress.total) * 100);
	    dialog.dialog('close'); // maybe fade out
	};

	var createAllComplexTable = function() {
	    // create the table
	    var header = [
		{value: 'Complex Id', sort: true, search: true},
		{value: 'Name', sort: true, search: true},
		{value: 'Roles', sort: true, search: true},
		{value: 'Reactions', sort: true, search: true},
		{value: 'Compartment', sort: true, search: true}
	    ];

	    var data = [];
	    for (var it=msdata.complex.iterator(); it.hasNext(); ) {
		var complex = it.next();
		var name = 'none', compart='none'; // empty for now
		var roles = complex.roles;
		var reactions = complex.reactions;

		var idLink = createComplexLink(complex.id);

		var cpxRoles = [];
		if (roles.length > 0) {
		    for (var i=0,ii=roles.length; i<ii; i++) {
			cpxRoles.push(msdata.role.get('id', roles[i]).name);

		    }
		} else {
		    cpxRoles.push('none');
		}

		var cpxRxns = [];
		if (reactions.length > 0) {
		    for (var i=0,ii=reactions.length; i<ii; i++) {
			var rxnId = msdata.reaction.get('id', reactions[i]).id;
			    cpxRxns.push(rxnId);
		    }
		} else {
		    cpxRxns.push('none');
		}

		var cpxRxnLinks = [];
		if (reactions.length > 0) {
		    cpxRxns.sort();
		    for (var i=0,ii=cpxRxns.length; i<ii; i++) {
			cpxRxnLinks.push(createReactionLink(cpxRxns[i]));
		    }
		} else {
		    cpxRxnLinks.push('none');
		}

		data.push([
		    idLink,
		    name,
		    {value: cpxRoles.join('<br />'), search: cpxRoles.join(' '), sort: cpxRoles.join(' ')},
		    {value: cpxRxnLinks.join(', '), search: cpxRxns.join(' '), sort: cpxRxns.join(' ')},
		    compart
		]);
	    }

	    var options = {
		pagination: true,
		rowsPerPage: 10
	    };

	    complexTable = jstable.create(header, data, options);

	    return complexTable.getHtml();
	};

	var createAddRoleDialog = function() {
	    var addDiv = $('<div>Roles to add:<br /></div>');

	    var addRoles = false;
	    var rolesToAdd = {};
	    var roleCheckboxes = {};

	    // create the table
	    var options = {
		pagination: true,
		rowsPerPage: 10,
		onupdate: function() {
		    roleCheckboxes = {};
		}
	    };

	    var renderFunc = function(role) {
		var check = $('<input type="checkbox" />');
		roleCheckboxes[role.id] = check;

		if (rolesToAdd[role.id]) {
		    check.prop('checked', true);
		}

		check.click(function() {
		    if ($(this).prop('checked')) { // check
			var addRole = $('<span>');
			addRole.append(role.name + ' ');

			var remove = $('<a href="javascript:void(0)">(remove)</a>');
			remove.click(function() {
			    if (roleCheckboxes[role.id]) {
				roleCheckboxes[role.id].prop('checked', false);
			    }

			    $(this).parent().remove();
				delete rolesToAdd[role.id];
			});

			addRole.append(remove);
			addRole.append('<br />');
			addDiv.append(addRole);

			rolesToAdd[role.id] = {role: role, span: addRole};
		    } else { // uncheck
			rolesToAdd[role.id].span.remove();
			delete rolesToAdd[role.id];
		    }
		});

		return check;
	    };

	    var header = [
		{value: 'Add', render: renderFunc, sort: false, search: false},
		{value: 'Name', sort: true, search: true},
		{value: 'Subsystem', sort: true, search: true},
		{value: 'SS Class 1', sort: true, search: true},
		{value: 'SS Class 2', sort: true, search: true},
		{value: 'Exemplar Gene', sort: true, search: true}
	    ];

	    var roleRows = [];
	    for (var it=msdata.role.iterator(); it.hasNext(); ) {
		var role = it.next();

		var row = createRoleRow(role);
		row.unshift({data: role});

		roleRows.push({id: role.id, data: row});
	    }

	    var allRoleTable = jstable.create(header, roleRows, options);

	    var dialog = $('<div>');
	    dialog.append(addDiv);
	    dialog.append(allRoleTable.getHtml());
	    dialog.dialog({
		title: 'Add Role',
		width: 800,
		autoOpen: false,
		resizable: false,
		modal: true,
		buttons: {
		    'Add': function() {
			addRoles = true;
			$(this).dialog('close');
		    },
		    'Cancel': function() {
			$(this).dialog('close');
		    }
		}
	    });

	    dialog.bind('dialogclose', function() {
		if (addRoles) {
		    alert('You want to add roles');
		}

		$.each(rolesToAdd, function(i,v) {
		    v.span.children().filter('a').click();
		});
	    });

	    return dialog;
	};

	var createAddReactionDialog = function() {
	    var addDiv = $('<div>Reactions to add:<br /></div>');

	    var addReactions = false;
	    var reactionsToAdd = {};
	    var reactionCheckboxes = {};

	    // create the table
	    var options = {
		pagination: true,
		rowsPerPage: 10,
		onupdate: function() {
		    reactionCheckboxes = {};
		}
	    };

	    var renderFunc = function(reaction) {
		var check = $('<input type="checkbox" />');
		reactionCheckboxes[reaction.id] = check;

		if (reactionsToAdd[reaction.id]) {
		    check.prop('checked', true);
		}

		check.click(function() {
		    if ($(this).prop('checked')) { // check
			var addReaction = $('<span>');
			addReaction.append(reaction.id + ' ');

			var remove = $('<a href="javascript:void(0)">(remove)</a>');
			remove.click(function() {
			    if (reactionCheckboxes[reaction.id]) {
				reactionCheckboxes[reaction.id].prop('checked', false);
			    }

			    $(this).parent().remove();
				delete reactionsToAdd[reaction.id];
			});

			addReaction.append(remove);
			addReaction.append('<br />');
			addDiv.append(addReaction);

			reactionsToAdd[reaction.id] = {reaction: reaction, span: addReaction};
		    } else { // uncheck
			reactionsToAdd[reaction.id].span.remove();
			delete reactionsToAdd[reaction.id];
		    }
		});

		return check;
	    };

	    var header = [
		{value: 'Add', render: renderFunc, sort: false, search: false},
		{value: 'Reaction Id', sort: true, search: true},
		{value: 'Name', sort: true, search: true},
		{value: 'Equation', sort: true, search: true},
		{value: 'Complexes', sort: true, search: true},
		{value: 'Roles', sort: true, search: true},
		{value: 'Kegg Maps', sort: true, search: true},
		{value: 'Enzyme', sort: true, search: true},
		{value: 'Kegg Ids', sort: true, search: true}
	    ];

	    var reactionRows = [];
	    for (var it=msdata.reaction.iterator(); it.hasNext(); ) {
		var reaction = it.next();

		var row = createReactionRow(reaction);
		row.unshift({data: reaction});

		reactionRows.push({id: reaction.id, data: row});
	    }

	    var allReactionTable = jstable.create(header, reactionRows, options);

	    var dialog = $('<div>');
	    dialog.append(addDiv);
	    dialog.append(allReactionTable.getHtml());
	    dialog.dialog({
		title: 'Add Reaction',
		width: 800,
		autoOpen: false,
		resizable: false,
		modal: true,
		buttons: {
		    'Add': function() {
			addReactions = true;
			$(this).dialog('close');
		    },
		    'Cancel': function() {
			$(this).dialog('close');
		    }
		}
	    });

	    dialog.bind('dialogclose', function() {
		if (addReactions) {
		    alert('You want to add reactions');
		}

		$.each(reactionsToAdd, function(i,v) {
		    v.span.children().filter('a').click();
		});
	    });

	    return dialog;
	};

	var parseEquation = function(equation, rev, cpdIdToName) {
	    return equation;
	};

	var createComplexLink = function(complexId) {
	    var link = '<a href="#complex=' + complexId + '">' + complexId + '</a>';

	    return link;
	};

	var createReactionLink = function(reactionId) {
	    var link = '<a href="' + seedviewerUrl + '?page=ReactionViewer&reaction=' + reactionId + '" target="_blank">' + reactionId + '</a>';

	    return link;
	};

	var createSubsystemLink = function(subsystem) {
	    var ssClean = subsystem.replace(/_/g, ' ');
	    var link = '<a href="' + seedviewerUrl + '?page=Subsystems&subsystem=' + subsystem + '" target="_blank">' + ssClean + '</a>';

	    return link;
	};

	run();

    });
});

