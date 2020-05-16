import { Meteor } from 'meteor/meteor';
import '../imports/startup/Logger';
import './db/migrations';

import '../imports/api/users';
import '../imports/api/cards';
import '../imports/api/games';
import '../imports/api/rooms';
import '../imports/api/clues';
import '../imports/api/categories';
import '../imports/api/turns';

Meteor.startup(() => {
    reCAPTCHA.config({
        privatekey: Meteor.settings.recaptcha.key,
    });
    Logger.init();
    Migrations.migrateTo('latest');
});