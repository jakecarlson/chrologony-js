import '../imports/startup/accounts/config';
import '../imports/startup/accounts/templates';
import '../imports/startup/template-helpers';
import '../imports/modules/Logger';
import '../imports/modules/Formatter';
import '../imports/modules/Helpers';

import './routes';
import '../imports/ui/body';

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap4-toggle';
import 'bootstrap4-toggle/css/bootstrap4-toggle.min.css';

Meteor.startup(function() {
    Logger.init();
});