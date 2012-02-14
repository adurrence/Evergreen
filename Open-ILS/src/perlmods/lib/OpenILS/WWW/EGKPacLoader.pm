package OpenILS::WWW::EGKPacLoader;
use base 'OpenILS::WWW::EGCatLoader';
use strict; use warnings;
use XML::Simple;
use Apache2::Const -compile => qw(OK DECLINED FORBIDDEN HTTP_INTERNAL_SERVER_ERROR REDIRECT HTTP_BAD_REQUEST);
use OpenSRF::Utils::Logger qw/$logger/;
use OpenILS::Application::AppUtils;
use OpenILS::Utils::CStoreEditor qw/:funcs/;
my $U = 'OpenILS::Application::AppUtils';
my $kpac_config;

# -----------------------------------------------------------------------------
# Override our parent's load() sub so we can do kpac-specific path routing.
# -----------------------------------------------------------------------------
sub load {
    my $self = shift;

    $self->init_ro_object_cache;

    my $stat = $self->load_common;
    return $stat unless $stat == Apache2::Const::OK;

    $self->load_kpac_config;

    my $path = $self->apache->path_info;
    ($self->ctx->{page} = $path) =~ s#.*/(.*)#$1#g;

    return $self->load_simple("home") if $path =~ m|kpac/home|;
    return $self->load_simple("category") if $path =~ m|kpac/category|;
    return $self->load_rresults if $path =~ m|kpac/results|; # inherited 
    return $self->load_record(no_search => 1) if $path =~ m|kpac/record|; # inherited

    # ----------------------------------------------------------------
    #  Everything below here requires SSL
    # ----------------------------------------------------------------
    return $self->redirect_ssl unless $self->cgi->https;

    # XXX auth vs. no-auth, pending list answers
    return $self->load_simple("getit_results") if $path =~ m|kpac/getit_results|;

    if ($path =~ m|kpac/getit|) { # after getit_results
        my $stat = $self->load_record(no_search => 1);
        $self->ctx->{page} = 'getit'; # repair the page
        return $stat;
    }

    # ----------------------------------------------------------------
    #  Everything below here requires authentication
    # ----------------------------------------------------------------
    return $self->redirect_auth unless $self->editor->requestor;

    # AUTH pages

    return Apache2::Const::OK;
}


sub load_kpac_config {
    my $self = shift;
    my $path = '/home/berick/code/Evergreen/Open-ILS/examples/kpac.xml'; # TODO: apache config

    unless ($kpac_config) {
        $kpac_config = XMLin(
            $path,
            KeyAttr => ['id'],
            ForceArray => ['layout', 'page', 'cell'],
            NormaliseSpace => 2
        );
    }

    # TODO: make generic "whereami" sub for EGCatLoader.
    my $ou = $self->ctx->{physical_loc} || $self->cgi->param('loc') || $self->ctx->{aou_tree}->()->id;
    my $layout;

    # Search up the org tree to find the nearest config for the context org unit
    while (my $org = $self->ctx->{get_aou}->($ou)) {
        ($layout) = grep {$_->{owner} eq $org->id} @{$kpac_config->{layout}};
        last if $layout;
        $ou = $org->parent_ou;
    }

    $self->ctx->{kpac_layout} = $layout;
    $self->ctx->{kpac_config} = $kpac_config;
    $self->ctx->{kpac_root} = $self->ctx->{base_path} . "/kpac"; 
}


1;
