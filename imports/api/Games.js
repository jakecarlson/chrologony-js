import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Match, check } from 'meteor/check';
import { Promise } from "meteor/promise";
import { publishComposite } from 'meteor/reywood:publish-composite';
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';
import SimpleSchema from "simpl-schema";
import { Schemas } from "../modules/Schemas";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";

import { Turns } from './Turns';
import { Cards } from "./Cards";
import { Categories } from "./Categories";

export const Games = new Mongo.Collection('games');

Games.PRECISION_OPTIONS = [
    'second',
    'minute',
    'hour',
    'date',
    'month',
    'year',
    'decade',
    'century',
    'millennium',
];

Games.PUBLISH_FIELDS = {
    _id: 1,
    name: 1,
    private: 1,
    password: 1,
    ownerId: 1,
    categoryId: 1,
    currentTurnId: 1,
    currentRound: 1,
    currentLeaderId: 1,
    winnerId: 1,
    createdAt: 1,
    startedAt: 1,
    endedAt: 1,
    winPoints: 1,
    turnOrder: 1,
    minScore: 1,
    minDifficulty: 1,
    maxDifficulty: 1,
    equalTurns: 1,
    recycleCards: 1,
    cardLimit: 1,
    autoProceed: 1,
    cardTime: 1,
    showHints: 1,
    comparisonPrecision: 1,
    displayPrecision: 1,
    playerLimit: 1,
    noJoinAfterStart: 1,
    autoShowMore: 1,
    players: 1,
    token: 1,
};

Games.schema = new SimpleSchema({
    name: {type: String, max: 40, defaultValue: null, optional: true},
    password: {type: String, max: 72, defaultValue: null, optional: true},
    private: {type: Boolean, defaultValue: false, optional: true},
    categoryId: {type: String, regEx: SimpleSchema.RegEx.Id},
    currentTurnId: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
    currentRound: {type: Number, defaultValue: 1},
    currentLeaderId: {type: String, max: 17, defaultValue: null, optional: true},
    winnerId: {type: String, max: 17, defaultValue: null, optional: true},
    winPoints: {type: SimpleSchema.Integer, defaultValue: 10},
    equalTurns: {type: Boolean, defaultValue: false},
    minDifficulty: {type: Number, defaultValue: 0},
    maxDifficulty: {type: Number, defaultValue: 0},
    minScore: {type: SimpleSchema.Integer, defaultValue: 0},
    cardLimit: {type: SimpleSchema.Integer, defaultValue: 0},
    autoProceed: {type: Boolean, defaultValue: false},
    cardTime: {type: SimpleSchema.Integer, defaultValue: 0},
    turnOrder: {type: String, defaultValue: 'sequential'},
    recycleCards: {type: Boolean, defaultValue: false},
    showHints: {type: Boolean, defaultValue: false},
    displayPrecision: {type: String, defaultValue: 'date'},
    comparisonPrecision: {type: String, defaultValue: 'date'},
    playerLimit: {type: SimpleSchema.Integer, defaultValue: 0},
    noJoinAfterStart: {type: Boolean, defaultValue: false},
    autoShowMore: {type: Boolean, defaultValue: false},
    players: {type: Array, defaultValue: [], optional: true},
    'players.$': {type: String, max: 17},
});
Games.schema.extend(Schemas.ownable(true, true));
Games.schema.extend(Schemas.timestampable);
Games.schema.extend(Schemas.endable);
Games.schema.extend(Schemas.softDeletable);
Games.attachSchema(Games.schema);

Games.helpers({

    title() {
        if (this.name) {
            return this.name;
        } else {
            const category = Categories.findOne(this.categoryId);
            return category.name;
        }
    },

    playersWithNames() {
        const userIds = this.players;
        let players = Meteor.users.find(
            {
                _id: {$in: userIds},
            },
            {
                sort: {joinedGameAt: 1, 'profile.name': 1},
            }
        ).fetch();
        return _.sortBy(players, function(doc) {
            return userIds.indexOf(doc._id);
        });
    },

    numPlayers() {
        return this.players.length;
    },

    hasPlayer(userId) {
        if (!userId) {
            userId = Meteor.userId();
        }
        return this.players.includes(userId);
    },

    isOwner(userId = false) {
        if (!userId) {
            userId = Meteor.userId();
        }
        return (userId == this.ownerId);
    },

    isTurnOwner(userId = false) {
        if (!userId) {
            userId = Meteor.userId();
        }
        if (this.currentTurnId) {
            const turn = this.currentTurn();
            return (turn && (userId == turn.ownerId));
        }
        return false;
    },

    owner() {
        return Meteor.users.findOne(this.ownerId);
    },

    link() {
        return FlowRouter.url('game', {id: this._id, token: this.token});
    },

    category() {
        return Categories.findOne(this.categoryId);
    },

    currentTurn() {
        return Turns.findOne(this.currentTurnId);
    },

    turns() {
        return Turns.find({gameId: this._id});
    },

    currentLeader() {
        return (this.currentLeaderId ? Meteor.users.findOne(this.currentLeaderId) : null);
    },

    winner() {
        return Meteor.users.findOne(this.winnerId);
    },

    playerCards(userId, lockedOnly = false) {
        let selector = {
            gameId: this._id,
            ownerId: userId,
        };
        if (lockedOnly) {
            selector.lockedAt = {$ne: null};
        } else {
            selector.$or = [
                {lockedAt: {$ne: null}},
                {turnId: this.currentTurnId},
            ];
        }
        return Cards.find(
            selector,
            {
                sort: {
                    pos: 1,
                    createdAt: -1,
                }
            }
        );
    },

    playersWithCounts() {
        const players = Promise.await(
            Cards.rawCollection().aggregate(
                [
                    {
                        $match: {
                            gameId: this._id,
                            ownerId: {$in: this.players},
                        }
                    },
                    {
                        $group: {
                            _id: "$ownerId",
                            lastCardTime: {$max: "$createdAt"},
                            lockedCards: {$addToSet: "$lockedAt"},
                            uniqueTurns: {$addToSet: "$turnId"},
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            lastCardTime: 1,
                            turns: {$size:"$uniqueTurns"},
                            cards: {
                                $size: {
                                    $filter: {
                                        input: "$lockedCards",
                                        as: "item",
                                        cond: {$ne: ["$$item", null]}
                                    }
                                }
                            }
                        }
                    },
                    {
                        $sort: {
                            cards: -1,
                            lastCardTime: 1,
                        }
                    },
                ]
            ).toArray()
        );
        return players;
    },

    calculateCurrentLeader() {
        const players = this.playersWithCounts();
        return players[0];
    },

    calculateCurrentRound() {
        const players = this.getPlayerTurnCounts();
        return players[0].turns;
    },

    getPlayerTurnCounts() {

        // Get turn counts for players who have had turns in the current game and are still in the game
        let sort = {
            turns: -1,
        };
        if (this.turnOrder != 'random') {
            sort.lastTurn = (this.turnOrder == 'snake') ? 1 : -1;
        }

        const players = Promise.await(
            Turns.rawCollection().aggregate(
                [
                    {$match: {gameId: this._id, ownerId: {$in: this.players}}},
                    {$group: {_id: "$ownerId", turns: {$sum: 1}, lastTurn: {$max: "$createdAt"}}},
                    {$sort: sort},
                ]
            ).toArray()
        );

        // Create an array of users who have already had turns
        const alreadyPlayed = [];
        players.forEach(function(player) {
            alreadyPlayed.push(player._id);
        });

        // Get all players in the game that haven't had turns yet
        const notPlayed = _.difference(this.players, alreadyPlayed);
        if (notPlayed.length > 0) {
            const users = Meteor.users.find(
                {_id: {$in: notPlayed}},
                {sort: {joinedGameAt: -1}}
            ).fetch();
            const sortedUsers = _.sortBy(users, function(doc) {
                return notPlayed.indexOf(doc._id);
            });
            sortedUsers.forEach(function(user) {
                players.push({
                    _id: user._id,
                    turns: 0,
                    lastTurn: null,
                });
            });
        }

        return players;

    },

    getNextPlayer() {

        // Get players sorted by turn count descending
        Logger.log('Getting turn counts ...');
        const players = this.getPlayerTurnCounts();
        Logger.log('Player Turn Counts: ' + JSON.stringify(players));

        // If the turn order is random, randomly select one of the players with the fewest turns
        let nextPlayer = null;
        if (this.turnOrder == 'random') {
            let leastTurnPlayers = [];
            const lastIndex = players.length-1;
            const minTurns = players[players.length-1].turns;
            for (let i = lastIndex; i >= 0; --i) {
                if (players[i].turns != minTurns) break;
                leastTurnPlayers.push(players[i]);
            }
            nextPlayer = leastTurnPlayers[Math.floor(Math.random() * leastTurnPlayers.length)];

        // Otherwise just pluck the bottom player
        } else {
            nextPlayer = players[players.length-1];
        }

        return nextPlayer;

    },

});

if (Meteor.isServer) {

    publishComposite('games', function(additionalGameIds) {
        return {

            find() {
                if (this.userId) {

                    let selector = {
                        deletedAt: null,
                        $or: [
                            {players: this.userId, endedAt: null},
                            {
                                private: false,
                                'players.0': {$exists: true},
                                endedAt: null,
                                $and: [
                                    {$or: [
                                        {noJoinAfterStart: false},
                                        {startedAt: null},
                                    ]},
                                    {$or: [
                                        {playerLimit: 0},
                                        {$expr:{$lt:[{$size:"$players"}, "$playerLimit"]}},
                                    ]},
                                ],
                            },
                        ],
                    };
                    if (additionalGameIds) {
                        selector.$or.push({_id: {$in: additionalGameIds}});
                    }

                    return Games.find(
                        selector,
                        {
                            fields: Games.PUBLISH_FIELDS,
                            sort: {
                                // name: 1,
                                createdAt: -1,
                            },
                            limit: 100,
                            transform: function(doc) {
                                if (additionalGameIds && additionalGameIds.includes(doc._id)) {
                                    doc.token = Hasher.md5.hash(doc._id);
                                }
                                doc.password = (doc.password ? true : false);
                                return doc;
                            },
                        }
                    );

                } else {
                    return this.ready();
                }
            },
            
        }

    });

    Meteor.publish('anonymousGame', function anonymousGamePublication(id) {
        if (this.userId && id) {
            return Games.find(
                {
                    _id: id
                },
                {
                    fields: Games.PUBLISH_FIELDS,
                }
            );
        } else {
            return this.ready();
        }
    });

    Games.deny({
        insert() { return true; },
        remove() { return true; },
    });

}

Meteor.methods({

    'game.leave'(id, userId = false) {

        // If no userID was provided, use the current user
        if (!userId) {
            userId = Meteor.userId();
        }

        check(userId, RecordId);
        Permissions.authenticated();

        Logger.log('User ' + userId + ' Left Game: ' + id);
        Logger.audit('leave', {collection: 'Games', documentId: id});

        // Make sure the user is the owner of the game that the other user is in, or the user him/herself
        const game = Games.findOne(id);
        if (userId != Meteor.userId()) {
            Permissions.owned(game);
        }

        // If the user isn't in a game, just pretend like it worked
        if (!game.hasPlayer(userId)) {
            return userId;
        }

        // We don't want to actually remove the player if the game has already ended
        const user = Meteor.users.findOne(userId);
        if (!game.endedAt) {

            // Check to see if it's this user's turn currently and end it if so -- but only if it's a multiplayer game
            if (game && (game.players.length > 1)) {
                if (game.currentTurnId) {
                    const turn = game.currentTurn();
                    if (turn.ownerId == userId) {
                        Meteor.call('turn.next', game._id);
                    }
                }
            }

            // If the player is the owner, we need to move ownership to the next person in the game or abandon if none
            if (userId == game.ownerId) {

                if (game.players.length > 1) {
                    Games.update(id, {$set: {ownerId: game.players[1]}});
                } else {
                    Meteor.call('game.end', id, true);
                }

                if (Meteor.isClient) {
                    if (Session.get('currentGameId') == game._id) {
                        Session.set('currentGameId', undefined);
                    }
                }

            }

            // Remove the player from the players array & null out the user's current game ID
            Meteor.call('game.removePlayer', id, userId);

        }

        // Reset the user's current game
        if (user.currentGameId == id) {
            Meteor.call('user.setGame', null, userId);
        }

        return userId;

    },

    // Update
    'game.update'(id, attrs) {

        check(id, RecordId);
        check(
            attrs,
            {
                currentTurnId: RecordId,
                currentRound: Match.Integer,
                currentLeaderId: Match.OneOf(String, null),
            }
        );

        Permissions.authenticated();
        const game = Games.findOne(id);
        Permissions.check(game.hasPlayer(Meteor.userId()));
        Logger.log('Update Game: ' + id + ': ' + JSON.stringify(attrs));

        // Update the game
        const updated = Games.update(id, {$set: attrs});
        if (!updated) {
            throw new Meteor.Error('game-not-updated', 'Could not update a game.');
        }

        return updated;

    },

});

if (Meteor.isServer) {

    Meteor.methods({

        // Insert
        'game.create'(attrs) {

            check(
                attrs,
                {
                    categoryId: RecordId,
                    name: Match.OneOf(String, null),
                    password: Match.OneOf(String, null),
                    private: Boolean,
                    winPoints: Match.Integer,
                    equalTurns: Boolean,
                    minDifficulty: Match.Integer,
                    maxDifficulty: Match.Integer,
                    minScore: Match.Integer,
                    cardLimit: Match.Integer,
                    autoProceed: Boolean,
                    cardTime: Match.Integer,
                    turnOrder: NonEmptyString,
                    recycleCards: Boolean,
                    showHints: Boolean,
                    comparisonPrecision: NonEmptyString,
                    displayPrecision: NonEmptyString,
                    playerLimit: Match.Integer,
                    noJoinAfterStart: Boolean,
                    autoShowMore: Boolean,
                    players: Match.Maybe(Array),
                }
            );
            Permissions.authenticated();

            // Throw an error if there is an active game with that name already
            if (Helpers.isNonEmptyString(attrs.name)) {
                const existingGame = Games.findOne(
                    {
                        deletedAt: null,
                        endedAt: null,
                        private: false,
                        name: {
                            $regex: new RegExp(`^${attrs.name}$`),
                            $options: 'i',
                        },
                    },
                    {
                        sort: {
                            createdAt: -1,
                        },
                    }
                );
                if (existingGame) {
                    throw new Meteor.Error('duplicate-object', 'A game with that name already exists.');
                }
            }

            // Check the precision values
            Permissions.check(Games.PRECISION_OPTIONS.includes(attrs.comparisonPrecision));
            Permissions.check(Games.PRECISION_OPTIONS.includes(attrs.displayPrecision));

            Logger.log('Create Game: ' + JSON.stringify(attrs));

            // Hash the password
            if (Helpers.isNonEmptyString(attrs.password)) {
                attrs.password = Hasher.bcrypt.hash(attrs.password);
            }

            // Create the new game
            try {

                const gameId = Games.insert({
                    categoryId: attrs.categoryId,
                    name: attrs.name,
                    password: attrs.password,
                    private: attrs.private,
                    winPoints: attrs.winPoints,
                    equalTurns: attrs.equalTurns,
                    minDifficulty: attrs.minDifficulty,
                    maxDifficulty: attrs.maxDifficulty,
                    minScore: attrs.minScore,
                    cardLimit: attrs.cardLimit,
                    autoProceed: attrs.autoProceed,
                    cardTime: attrs.cardTime,
                    turnOrder: attrs.turnOrder,
                    recycleCards: attrs.recycleCards,
                    showHints: attrs.showHints,
                    comparisonPrecision: attrs.comparisonPrecision,
                    displayPrecision: attrs.displayPrecision,
                    playerLimit: attrs.playerLimit,
                    noJoinAfterStart: attrs.noJoinAfterStart,
                    autoShowMore: attrs.autoShowMore,
                    players: ((attrs.players) ? attrs.players : [Meteor.userId()]),
                });

                Logger.audit('create', {collection: 'Games', documentId: gameId});

                if (gameId) {
                    const updated = Meteor.users.update(
                        Meteor.userId(),
                        {
                            $set: {
                                currentGameId: gameId,
                                joinedGameAt: new Date(),
                            }
                        }
                    );
                    if (!updated) {
                        throw new Meteor.Error('user-not-updated', 'Could not set current game for user.');
                    }
                }

                return gameId;

            } catch(err) {
                throw new Meteor.Error('game-not-inserted', 'Could not create a game.', err);
            }

        },

        'game.join'(id, password = null, userId = null) {

            check(id, RecordId);
            check(password, Match.OneOf(String, null));
            check(userId, Match.OneOf(RecordId, null));

            const game = Games.findOne(
                {
                    _id: id,
                    deletedAt: null,
                },
                {
                    sort: {
                        createdAt: -1,
                    },
                }
            );

            if (game) {

                // Check for the correct password
                if (password) {
                    Permissions.check(((game.ownerId == this.userId) || Hasher.bcrypt.match(password, game.password)));
                }

                // Don't allow a player to join if that puts it over the player limit
                if (
                    game.playerLimit &&
                    !game.hasPlayer(userId) &&
                    (game.numPlayers() >= game.playerLimit)
                ) {
                    throw new Meteor.Error('game-full', 'The game is full. Please choose another game.');
                }

                // Don't allow the player to join if joins aren't allowed after game start, and the game has already started
                if (game.noJoinAfterStart && game.startedAt) {
                    throw new Meteor.Error('game-not-started', 'The game does not allow players to join after it starts. Please choose another game.');
                }

            } else {
                throw new Meteor.Error('not-found', 'Game not found.');
            }

            // Add the user to the players array and set their current game
            Meteor.call('game.addPlayer', id, this.userId);
            Meteor.call('user.setGame', id, this.userId);

            return id;

        },

        'game.joinByToken'(id, token) {

            check(id, RecordId);
            check(token, NonEmptyString);
            Permissions.authenticated();

            const game = Games.findOne({_id: id, deletedAt: null});
            if (game && (Hasher.md5.hash(id) == token.trim())) {
                Meteor.call('game.addPlayer', id, this.userId);
                Meteor.call('user.setGame', id, this.userId);
                return id;
            } else {
                Meteor.call('game.leave', id, this.userId);
                throw new Meteor.Error('not-authorized');
            }

        },

        // Start
        'game.start'(id) {

            check(id, RecordId);
            Permissions.authenticated();

            const game = Games.findOne(id);
            Permissions.owned(game);

            Logger.audit('start', {collection: 'Games', documentId: id});

            const updated = Games.update(id, {$set: {startedAt: new Date()}});
            if (!updated) {
                throw new Meteor.Error('game-not-updated', 'Could not start a game.');
            }

            Meteor.call('turn.next', id);

            return id;

        },

        'game.invite'(email, id, url) {

            const game = Games.findOne(id);
            if (game) {

                Permissions.authenticated();
                Permissions.check(Permissions.owned(game));

                const invite = Helpers.renderHtmlEmail({
                    subject: Meteor.settings.public.app.invite.subject,
                    preview: Meteor.settings.public.app.invite.preview,
                    template: 'game_invite',
                    data: {
                        title: game.title(),
                        url: url,
                        inviter: Meteor.user().name(),
                    },
                });

                Logger.audit('invite', {collection: 'Games', documentId: id, attrs: {email: email}});

                this.unblock();

                Email.send({
                    from: Meteor.settings.public.app.sendEmail,
                    to: email,
                    subject: Meteor.settings.public.app.invite.subject,
                    text: invite.text,
                    html: invite.html,
                });

                return game._id;

            } else {
                throw new Meteor.Error('not-found', 'Game does not exist.');
            }

        },

        // End
        'game.end'(id, abandon = false) {

            check(id, RecordId);
            Permissions.authenticated();
            const game = Games.findOne(id);
            Permissions.check(game.hasPlayer(Meteor.userId()));

            // Initialize game end attributes
            let attrs = {
                endedAt: new Date(),
                currentTurnId: null,
            }

            // Treat the game as deleted if it is being abandoned
            if (abandon) {
                attrs.deletedAt = new Date();

            // Only award a win if there were actually any turns and someone met the criteria
            } else if (game.currentTurnId) {
                const winner = game.calculateCurrentLeader();
                if (!game.winPoints || (winner.cards >= game.winPoints)) {
                    attrs.winnerId = winner._id;
                }
            }

            // Update the game
            const updated = Games.update(
                id,
                {
                    $set: attrs,
                }
            );
            if (!updated) {
                throw new Meteor.Error('game-not-updated', 'Could not end a game.');
            }

            Logger.log('End Game: ' + id);
            Logger.audit((abandon ? 'abandon' : 'end'), {collection: 'Games', documentId: id});

            return updated;

        },

        // Get Last Owned Game
        'game.lastOwned'() {
            const game = Games.findOne({ownerId: this.userId}, {sort: {createdAt: -1}});
            return (game ? game._id : null);
        },

        'game.clone'(id) {

            check(id, RecordId);
            Permissions.authenticated();

            // Get the game to clone and validate the user is the owner of it
            const game = Games.findOne(id);
            Permissions.check(Permissions.owned(game));

            // Create the new game
            const removeKeys = [
                '_id',
                'ownerId',
                'createdAt',
                'startedAt',
                'endedAt',
                'currentTurnId',
                'currentLeaderId',
                'currentRound',
                'winnerId',
                'updatedAt',
                'deletedAt',
            ];
            const attrs = _.omit(Helpers.bsonToObject(game), removeKeys);
            const gameId = Meteor.call('game.create', attrs);

            // If this is an anonymous game, auto-start the next one
            if (Helpers.isAnonymous()) {
                Meteor.call('game.start', gameId);

            // Otherwise copy over all players to the new game but don't auto-start
            } else {
                game.playersWithNames().forEach(function(user) {
                    Meteor.call('user.setGame', gameId, user._id);
                });
            }

            return gameId;

        },

        'game.addPlayer'(id, userId = false) {
            const game = Games.findOne(id);
            if (!userId) {
                userId = Meteor.userId();
            }
            if (!game.players.includes(userId)) {
                const updated = Games.update(id, {$push: {players: userId}});
                if (!updated) {
                    throw new Meteor.Error('game-not-updated', 'Could not add player to game.');
                }
                return updated;
            }
            return 0;
        },

        'game.removePlayer'(id, userId = false) {
            const game = Games.findOne(id);
            if (!userId) {
                userId = Meteor.userId();
            }
            const updated = Games.update(id, {$pull: {players: userId}});
            if (!updated) {
                throw new Meteor.Error('game-not-updated', 'Could not remove player from game.');
            }
            return updated;
        },

    });

}