import { Games } from '../../../imports/api/Games';
import { Turns } from "../../../imports/api/Turns";
import { Promise } from "meteor/promise";

// Add currentRound to game model.
Migrations.add({

    version: 19,
    name: 'Add currentRound to game model.',

    up: function() {
        Games.find({}).forEach(function(game) {
            const players = Promise.await(
                Turns.rawCollection().aggregate(
                    [
                        {$match: {gameId: game._id}},
                        {$group: {_id: "$ownerId", turns: {$sum: 1}}},
                        {$sort: {turns: -1}},
                    ]
                ).toArray()
            );
            let currentRound = 1;
            if (players.length > 0) {
                currentRound = players[0].turns;
            }
            Games.update(game._id, {$set: {currentRound: currentRound}});
        });
    },

    down: function() {
        Games.update({}, {$unset: {currentRound: 1}}, {multi: true});
    }

});