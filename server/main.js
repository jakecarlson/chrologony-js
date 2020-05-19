import { Meteor } from 'meteor/meteor';
import '../imports/modules/Logger';
import './db/migrations';
import './db/importer';

import '../imports/api/Users';
import '../imports/api/Cards';
import '../imports/api/Games';
import '../imports/api/Rooms';
import '../imports/api/Clues';
import '../imports/api/Categories';
import '../imports/api/Turns';

Meteor.startup(() => {
    reCAPTCHA.config({
        privatekey: Meteor.settings.recaptcha.key,
    });
    Logger.init();
    Migrations.migrateTo('latest');
});