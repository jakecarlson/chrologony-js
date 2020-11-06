import { Meteor } from 'meteor/meteor';
import { Cards } from "../../../imports/api/Cards";
import { Categories } from "../../../imports/api/Categories";
import { Clues } from "../../../imports/api/Clues";
import { Turns } from "../../../imports/api/Turns";

const INDEXES = [

    {
        collection: Cards,
        indexes: {
            clue: {
                clueId: 1,
            },
            incorrect: {
                clueId: 1,
                correct: 1,
            },
            recycled: {
                gameId: 1,
                lockedAt: 1,
                turnId: 1,
            },
            sort: {
                position: 1,
                createdAt: 1,
            },
        },
    },

    {
        collection: Categories,
        indexes: {
            sort: {
                theme: 1,
                name: 1,
            },
        },
    },

    {
        collection: Clues,
        indexes: {
            owned: {
                ownerId: 1,
            },
        },
    },

    {
        collection: Turns,
        indexes: {
            sort: {
                createdAt: -1,
            },
        },
    },

    {
        collection: Meteor.users,
        indexes: {
            sort: {
                joinedRoomAt: 1,
                'profile.name': 1,
            },
        },
    },

];

// Backfill indexes.
Migrations.add({

    version: 22,
    name: 'Backfill indexes.',

    up: function() {
        Meteor.users.update({joinedRoomAt: {$exists: false}}, {$set: {joinedRoomAt: null}}, {multi: true});
        INDEXES.forEach(function(attrs) {
            for (const name in attrs.indexes) {
                attrs.collection.rawCollection().createIndex(
                    attrs.indexes[name],
                    {
                        name: name,
                        background: true,
                    }
                );
            }
        });
    },

    down: function() {
        INDEXES.forEach(function(attrs) {
            for (const name in attrs.indexes) {
                attrs.collection.rawCollection().dropIndex(name);
            }
        });
        Meteor.users.update({}, {$unset: {joinedRoomAt: 1}}, {multi: true});
    }

});