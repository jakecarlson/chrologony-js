import '../imports/startup/accounts/config';
import '../imports/startup/accounts/templates';
import '../imports/startup/template-helpers';
import '../imports/modules/Logger';
import '../imports/modules/Formatter';
import '../imports/modules/Helpers';
import '../imports/modules/SoundManager';
import '../imports/modules/GameObserver';

import './routes';
import '../imports/ui/body';

import 'bootstrap';
import 'bootswatch/dist/pulse/bootstrap.min.css';
import 'bootstrap4-toggle';
import 'bootstrap4-toggle/css/bootstrap4-toggle.min.css';

Meteor.startup(function() {
    Logger.init();
});