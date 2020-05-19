import { Meteor } from 'meteor/meteor';
import { ImportSets } from "./db/importer";
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

    // Initalize recaptcha
    reCAPTCHA.config({
        privatekey: Meteor.settings.recaptcha.key,
    });

    // Initialize the logger
    Logger.init();

    // Run any migrations that haven't run
    Migrations.migrateTo('latest');

    // Do any imports that are queued up
    ImportSets.find({completedAt: null}).fetch().forEach(function(importSet) {
        Meteor.call('importer.import', importSet._id, function(error, res) {
            if (!error) {
                Logger.log("Imported Set " + importSet._id);
            }
        });
    });

});