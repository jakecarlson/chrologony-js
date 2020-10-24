import { Games } from '../../../imports/api/Games';

// Add currentLeaderId to game model.
Migrations.add({

    version: 20,
    name: 'Add currentLeaderId to game model.',

    up: function() {
        Games.find({}).forEach(function(game) {
            const leader = game.calculateCurrentLeader();
            let attrs = {};
            attrs.currentLeaderId = (leader ? leader._id : null);
            if (!game.winnerId) {
                attrs.winnerId = attrs.currentLeaderId;
            }
            Games.update(game._id, {$set: attrs});
        });
    },

    down: function() {
        Games.update({}, {$unset: {currentLeaderId: 1}}, {multi: true});
    }

});