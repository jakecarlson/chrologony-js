import { Games } from '../../../imports/api/Games';

// Add auto-proceed option to games.
Migrations.add({
    version: 18,
    name: 'Add auto-proceed option to games.',
    up: function() {
        Games.update({}, {$set: {autoProceed: false}}, {multi: true});
    },
    down: function() {
        Games.update({}, {$unset: {autoProceed: 1}}, {multi: true});
    }
});