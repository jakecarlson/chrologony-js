import { Clues } from '../../../imports/api/Clues';

// Add open flag to clues.
Migrations.add({

    version: 29,
    name: 'Add open flag to clues.',

    up: function() {
        Clues.update({}, {$set: {open: false}}, {multi: true});
    },

    down: function() {
        Clues.update({}, {$unset: {open: 1}}, {multi: true});
    },

});