import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { SSR, Template } from 'meteor/meteorhacks:ssr';
import '../imports/modules/Logger';
import '../imports/modules/Hasher';
import '../imports/modules/Formatter';
import '../imports/modules/Helpers';
import '../imports/startup/accounts/config';
import '../imports/startup/accounts/email';
import '../imports/startup/template-helpers';

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

// Return special meta data for search engines / social networks
const serverRendering = function(req, res, next) {

    try {

        const ua = req.headers['user-agent'];
        const robots = new RegExp(Meteor.settings.robots.ua, 'i');

        if (robots.test(ua)) {

            SSR.compileTemplate('robots', Assets.getText('robots.html'));
            Template.robots.helpers({
                docType: function() {
                    return "<!DOCTYPE html>";
                }
            });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.end(SSR.render('robots'));

        } else {
            next();
        }

    } catch (err) {
        console.log(err);
    }

};

WebApp.connectHandlers.use(serverRendering);