import { Meteor } from 'meteor/meteor';
import '../imports/modules/Logger';
import '../imports/modules/Hasher';
import '../imports/modules/Formatter';
import '../imports/modules/Helpers';
import './db/migrations';
import './db/importer';

import '../imports/api/Users';
import '../imports/api/Cards';
import '../imports/api/Games';
import '../imports/api/Rooms';
import '../imports/api/Clues';
import '../imports/api/Categories';
import '../imports/api/Turns';
import '../imports/api/Votes';

Meteor.startup(() => {

    // Initialize the logger
    Logger.init();

    // Run any migrations that haven't run
    Migrations.migrateTo('latest');

    // Do any imports that are queued up
    Meteor.call('importer.importQueued');

});