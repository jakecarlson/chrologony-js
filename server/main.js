import { Meteor } from 'meteor/meteor';
import '../imports/startup/Logger';

import '../imports/api/users.js';
import '../imports/api/cards.js';
import '../imports/api/games.js';
import '../imports/api/rooms.js';
import '../imports/api/clues.js';
import '../imports/api/categories.js';
import '../imports/api/turns.js';

Meteor.startup(() => {
    reCAPTCHA.config({
        privatekey: Meteor.settings.recaptcha.key,
    });
    Logger.init();
});