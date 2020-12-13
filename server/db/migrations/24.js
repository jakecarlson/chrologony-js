import { Meteor } from 'meteor/meteor';
import { Rooms } from '../../../imports/api/Rooms';
import { Games } from '../../../imports/api/Games';

// Add name, password, and private to games.
Migrations.add({

    version: 24,
    name: 'Add name, password, and private to games.',

    up: function() {
        Games.update(
            {},
            {
                $set: {name: null, password: null, private: true, ownerId: null, players: [], deletedAt: null},
                $unset: {roomId: 1},
            },
            {multi: true}
        );
        Games.find({}).fetch().forEach(function(game) {
            let ownerId = game.ownerId;
            if (!ownerId && game.roomId) {
                const room = Rooms.findOne(game.roomId);
                ownerId = room.ownerId;
            }
            Games.update(game._id, {$set: {ownerId: ownerId}});
        });
        Meteor.users.update({}, {$set: {currentGameId: null, gameJoinedAt: null}}, {multi: true});
    },

    down: function() {
        Meteor.users.update({}, {$unset: {currentGameId: 1, gameJoinedAt: 1}}, {multi: true});
        Games.update({}, {$unset: {name: 1, password: 1, private: 1, ownerId: 1, players: 1, deletedAt: 1}}, {multi: true});
    },

});