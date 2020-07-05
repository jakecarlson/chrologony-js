import { Meteor } from 'meteor/meteor';
import { Cards } from '../../../imports/api/Cards';
import { Categories } from '../../../imports/api/Categories';
import { Clues } from '../../../imports/api/Clues';
import { Games } from '../../../imports/api/Games';
import { ImportSets } from '../importer';
import { Imports } from '../importer';
import { Rooms } from '../../../imports/api/Rooms';
import { Turns } from '../../../imports/api/Turns';
import { Votes } from '../../../imports/api/Votes';

const INDEXES = [

    {
        collection: Cards,
        indexes: {
            game: {
                gameId: 1,
            },
            locked: {
                gameId: 1,
                ownerId: 1,
                lockedAt: 1,
            },
            currentTurn: {
                turnId: 1,
            },
            owned: {
                gameId: 1,
                ownerId: 1,
            },
            player: {
                gameId: 1,
                ownerId: 1,
                turnId: 1,
                lockedAt: 1,
            },
            guessed: {
                turnId: 1,
                correct: 1,
            },
        },
    },

    {
        collection: Categories,
        indexes: {
            allowed: {
                private: 1,
                ownerId: 1,
                collaborators: 1,
            },
            owned: {
                ownerId: 1,
            },
            collaborators: {
                collaborators: 1,
            },
            search: {
                _id: 1,
                active: 1,
                source: 1,
                name: 1,
                theme: 1,
                ownerId: 1,
                private: 1,
                collaborators: 1,
            },
            source: {
                source: 1,
            },
        },
    },

    {
        collection: Clues,
        indexes: {
            draw: {
                active: 1,
                categories: 1,
            },
            prefilter: {
                categories: 1,
                ownerId: 1,
            },
            search: {
                description: "text",
                date: "text",
                moreInfo: "text",
                hint: "text",
            },
            categories: {
                categories: 1,
            },
        },
    },

    {
        collection: Games,
        indexes: {
            room: {
                roomId: 1,
            },
        },
    },

    {
        collection: ImportSets,
        indexes: {
            status: {
                startedAt: 1,
                completedAt: 1,
            },
        },
    },

    {
        collection: Imports,
        indexes: {
            set: {
                setId: 1,
            },
        },
    },

    {
        collection: Rooms,
        indexes: {
            deleted: {
                deletedAt: 1,
            },
        },
    },

    {
        collection: Turns,
        indexes: {
            game: {
                gameId: 1,
            },
            counts: {
                gameId: 1,
                ownerId: 1,
                createdAt: 1,
            },
        },
    },

    {
        collection: Meteor.users,
        indexes: {
            room: {
                currentRoomId: 1,
            },
            search: {
                'profile.name': 1,
            },
        },
    },

    {
        collection: Votes,
        indexes: {
            clue: {
                ownerId: 1,
                clueId: 1,
            },
            score: {
                clueId: 1,
            },
        },
    },

];

// Add indexes to schema
Migrations.add({

    version: 9,
    name: 'Add indexes to schema.',

    up: function() {
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
    }

});