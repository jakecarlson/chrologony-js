import '../imports/startup/accounts-config.js';
import '../imports/startup/template-helpers.js';
import '../imports/modules/Logger';
import '../imports/modules/Formatter';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap4-toggle';
import 'bootstrap4-toggle/css/bootstrap4-toggle.min.css';
import '../imports/ui/body.js';
import './routes.js';

Meteor.startup(function() {
    Logger.init();
});