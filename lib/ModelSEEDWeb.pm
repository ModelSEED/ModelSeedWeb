package ModelSEEDWeb;
use Dancer ':syntax';
use LWP;

our $VERSION = '0.1';

set serializer => 'JSON';

# api proxy
any ['get', 'post'] => '/api' => sub {
    my $ua = LWP::UserAgent->new;
    my $method = lc request->method();
    
    # get the url from the config yaml file
    my $url = config->{ModelSEEDApi};
    if (!$url) {
	error "ModelSEEDApi pointer is not set: could not find 'ModelSEEDApi' option in config.yml";
	return send_error("ModelSEEDApi Pointer Not Set", 403);
    }

    # get database from params->{'db'}
    my $db = params->{'db'};
    if (!$db) {
	error "Api request, but no database specified";
	return send_error("Api Database Parameter (db) Not Found", 403);
    }

    debug "Calling $url/$db with params: ";
    my $params = params;
    foreach my $param (keys %$params) {
	debug "   $param: " . $params->{$param};
    }

#    my $response = $ua->$method("$url/$db", { function => 'methods' });
    my $response = $ua->$method("$url/$db", $params);

    # check if ok
    return $response->content;
};

# any ajax calls needed can be routed here, for example this can
# be used to get all the pages, all the modules, etc...
any ['get', 'post'] => '/ajax' => sub {
    my $method = params->{'method'};
    if ($method) {
	if ($method eq 'get_modules') {
	    my $modules_dir = "public/modules";
	    opendir(MODULES, $modules_dir);
	    my @modules = readdir(MODULES);
	    closedir(MODULES);

	    my $response = [];
	    foreach my $module (@modules) {
		my $module_dir = "$modules_dir/$module";
		next if ($module eq "." || $module eq ".." || $module eq "docs" || -f $module_dir);

		# look for doc.html and demo.js
		my $has_doc = -e "$module_dir/doc.html" ? 1 : 0;
		my $has_demo = -e "$module_dir/demo.js" ? 1 : 0;

		push(@$response, {
		    name => $module,
		    has_doc => $has_doc,
		    has_demo => $has_demo
		     });
	    }

	    return $response;
	} elsif ($method eq 'get_pages') {

	} else {
	    return "Unknown method: $method";
	}
    } else {
	return "Must supply a method parameter";
    }
};

# object and id
get qr{/(\w+)/(\w+)} => sub {
    my ($object, $id) = splat;

    forward "/$object";
};

# object
get qr{/(\w+)/?} => sub {
    my ($object) = splat;

    my $bundleName = config->{objects}->{$object};
    if (defined($bundleName)) {
	my $bundle = config->{bundles}->{$bundleName};
	if (defined($bundle)) {
	    template 'loading.tt', {object => ucfirst $object, js => $bundle->{js}};
	} else {
	    # return 404 not found
	    # only way I can figure to send the same error page as if you enter an invalid route
	    # is to use Dancer::Renderer->render_error. setting status with 'status 404' doesn't work

	    Dancer::Renderer->render_error(404);
	}
    } else {
	# return 404 not found
	# only way I can figure to send the same error page as if you enter an invalid route
	# is to use Dancer::Renderer->render_error. setting status with 'status 404' doesn't work

	Dancer::Renderer->render_error(404);
    }
};

# default object
get '/' => sub {
    template 'loading.tt';
};

true;
