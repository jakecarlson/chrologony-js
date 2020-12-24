import { Schemas } from "../../../imports/modules/Schemas";
import { Meteor } from 'meteor/meteor';
import { Games } from "../../../imports/api/Games";
import { Clues } from "../../../imports/api/Clues";

const INDEXES = [

    {
        collection: Games,
        indexes: {
            publish: {
                _id: 1,
                deletedAt: 1,
                players: 1,
                private: 1,
                endedAt: 1,
                noJoinAfterStart: 1,
                startedAt: 1,
                playerLimit: 1,
            },
        },
    },

    {
        collection: Clues,
        indexes: {
            draw_complex: {
                _id: 1,
                active: 1,
                categories: 1,
                difficulty: 1,
                score: 1,
            },
        },
    },

    {
        collection: Meteor.users,
        indexes: {
            sort: {
                joinedGameAt: 1,
            },
        },
    },

];

// Backfill indexes.
Migrations.add({

    version: 28,
    name: 'Backfill indexes.',

    up: function() {
        Schemas.createIndexes(INDEXES);
    },

    down: function() {
        Schemas.dropIndexes(INDEXES);
    }

});