dojo.require('conify.fieldmapper.addToHash', true);
dojo.require('conify.fieldmapper.addFromHash', true);
dojo.require('conify.fieldmapper.addToStoreData', true);
dojo.require('conify.fieldmapper.addFromStoreItem', true);
dojo.require('dojo.parser');
dojo.require('dojo.data.ItemFileWriteStore');
dojo.require('dojo.date.stamp');
dojo.require('dijit.form.NumberSpinner');
dojo.require('dijit.form.TextBox');
dojo.require('dijit.form.TimeTextBox');
dojo.require('dijit.form.ValidationTextBox');
dojo.require('dijit.form.CheckBox');
dojo.require('dijit.form.FilteringSelect');
dojo.require('dijit.Tree');
dojo.require('dijit.layout.ContentPane');
dojo.require('dijit.layout.TabContainer');
dojo.require('dijit.layout.LayoutContainer');
dojo.require('dijit.layout.SplitContainer');
dojo.require('dojox.widget.Toaster');
dojo.require('dojox.fx');

// some handy globals
var cgi = new CGI();
var cookieManager = new HTTP.Cookies();
var ses = cookieManager.read('ses') || cgi.param('ses');
var pCRUD = new OpenSRF.ClientSession('open-ils.permacrud');

var current_type;
var virgin_out_id = -1;

var highlighter = {};

function status_update (markup) {
	if (parent !== window && parent.status_update) parent.status_update( markup );
}

function save_type () {

	var modified_aout = new aout().fromStoreItem( current_type );
	modified_aout.ischanged( 1 );

	new_kid_button.disabled = false;
	save_out_button.disabled = false;
	delete_out_button.disabled = false;

	pCRUD.request({
		method : 'open-ils.permacrud.update.aout',
		timeout : 10,
		params : [ ses, modified_aout ],
		onerror : function (r) {
			highlighter.editor_pane.red.play();
			status_update( 'Problem saving data for ' + ou_type_store.getValue( current_type, 'name' ) );
		},
		oncomplete : function (r) {
			var res = r.recv();
			if ( res && res.content() ) {
				ou_type_store.setValue( current_type, 'ischanged', 0 );
				highlighter.editor_pane.green.play();
				status_update( 'Saved changes to ' + ou_type_store.getValue( current_type, 'name' ) );
			} else {
				highlighter.editor_pane.red.play();
				status_update( 'Problem saving data for ' + ou_type_store.getValue( current_type, 'name' ) );
			}
		},
	}).send();
}

