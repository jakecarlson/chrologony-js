import { Categories } from '../../../imports/api/Categories';

// Add featured capability to categories.
Migrations.add({

    version: 36,
    name: 'Add featured capability to categories.',

    up: function() {
        Categories.update({}, {$set: {featured: false, featuredStartedAt: null, featuredEndedAt: null}}, {multi: true, validate: false});
    },

    down: function() {
        Categories.update({}, {$unset: {featured: 1, featuredStartedAt: 1, featuredEndedAt: 1}}, {multi: true, validate: false});
    },

});