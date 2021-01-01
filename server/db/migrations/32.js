import { Meteor } from 'meteor/meteor';

// Attempt to fix import UTF-8 character encoding issues retroactively.
Migrations.add({

    version: 32,
    name: 'Attempt to fix import UTF-8 character encoding issues retroactively.',

    up: function() {
        Meteor.call('importer.fixEncodings')
    },

    down: function() {
        // There's no going back
    },

});