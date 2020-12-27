import { Games } from '../../../imports/api/Games';

// Add game options playerLimit, noJoinAfterStart, and autoShowMore.
Migrations.add({

    version: 26,
    name: 'Add game options playerLimit, noJoinAfterStart, and autoShowMore.',

    up: function() {
        Games.update({}, {$set: {playerLimit: 0, noJoinAfterStart: false, autoShowMore: false}}, {multi: true});
    },

    down: function() {
        Games.update({}, {$unset: {playerLimit: 1, noJoinAfterStart: 1, autoShowMore: 1}}, {multi: true});
    },

});