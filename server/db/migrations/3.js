import { Categories } from '../../../imports/api/Categories';
import { Clues } from '../../../imports/api/Clues';
import { Rooms } from '../../../imports/api/Rooms';
import { Games } from '../../../imports/api/Games';
import { Turns } from '../../../imports/api/Turns';
import { Cards } from '../../../imports/api/Cards';

// Add 'Id' suffix to all fields referencing users.
Migrations.add({
    version: 3,
    name: 'Add \'Id\' suffix to all fields referencing users.',
    up: function() {
        Cards.update({}, {$rename: {"owner": "ownerId"}}, {multi: true});
        Categories.update({}, {$rename: {"owner": "ownerId"}}, {multi: true});
        Clues.update({}, {$rename: {"owner": "ownerId"}}, {multi: true});
        Rooms.update({}, {$rename: {"owner": "ownerId"}}, {multi: true});
        Turns.update({}, {$rename: {"owner": "ownerId"}}, {multi: true});
        Games.update({}, {$rename: {"winner": "winnerId"}}, {multi: true});
    },
    down: function() {
        Cards.update({}, {$rename: {"ownerId": "owner"}}, {multi: true});
        Categories.update({}, {$rename: {"ownerId": "owner"}}, {multi: true});
        Clues.update({}, {$rename: {"ownerId": "owner"}}, {multi: true});
        Rooms.update({}, {$rename: {"ownerId": "owner"}}, {multi: true});
        Turns.update({}, {$rename: {"ownerId": "owner"}}, {multi: true});
        Games.update({}, {$rename: {"winnerId": "winner"}}, {multi: true});
    }
});