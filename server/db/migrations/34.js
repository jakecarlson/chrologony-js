import { Meteor } from 'meteor/meteor';

// Create source categories.
Migrations.add({

    version: 34,
    name: 'Create source categories.',

    up: function() {
        Meteor.call('importer.addSourceCategories');
    },

    down: function() {
        // There's no going back
    },

});