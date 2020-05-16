import { Turns } from '../../imports/api/turns';
import { Cards } from '../../imports/api/cards';

// Rename userId to owner on Turns and Cards.
Migrations.add({
    version: 1,
    name: 'Rename userId to owner on Turns and Cards.',
    up: function() {
        Turns.update({}, {$rename: {"userId": "owner"}}, {multi: true});
        Cards.update({}, {$rename: {"userId": "owner"}}, {multi: true});
    },
    down: function() {
        Turns.update({}, {$rename: {"owner": "userId"}}, {multi: true});
        Cards.update({}, {$rename: {"owner": "userId"}}, {multi: true});
    }
});