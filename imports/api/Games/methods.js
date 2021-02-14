import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { NonEmptyString, RecordId } from "../../startup/validations";
import { Permissions } from '../../modules/Permissions';

import { Categories } from "../Categories";
import { Clues } from "../Clues";
import { Games } from "./index";

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

                // Remove the player from the players array & null out the user's current game ID
                Meteor.call('game.removePlayer', id, userId);

                if (Meteor.isClient) {
                    if (Session.get('currentGameId') == game._id) {
                        Session.set('currentGameId', undefined);
                    }
                }

            }

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
                    name: Match.Maybe(Match.OneOf(String, null)),
                    password: Match.Maybe(Match.OneOf(String, null)),
                    private: Match.Maybe(Match.OneOf(Boolean, null)),
                    winPoints: Match.Maybe(Match.Integer),
                    equalTurns: Match.Maybe(Boolean),
                    minDifficulty: Match.Maybe(Match.Integer),
                    maxDifficulty: Match.Maybe(Match.Integer),
                    minScore: Match.Maybe(Match.Integer),
                    cardLimit: Match.Maybe(Match.Integer),
                    autoProceed: Match.Maybe(Boolean),
                    cardTime: Match.Maybe(Match.Integer),
                    turnOrder: Match.Maybe(NonEmptyString),
                    recycleCards: Match.Maybe(Boolean),
                    showHints: Match.Maybe(Boolean),
                    comparisonPrecision: Match.Maybe(NonEmptyString),
                    displayPrecision: Match.Maybe(NonEmptyString),
                    playerLimit: Match.Maybe(Match.Integer),
                    noJoinAfterStart: Match.Maybe(Boolean),
                    autoShowMore: Match.Maybe(Boolean),
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

            // Add defaults
            attrs.name = attrs.name || null;
            attrs.password = attrs.password || null;
            attrs.private = attrs.private || false;
            attrs.winPoints = attrs.winPoints || Games.DEFAULT_WIN_POINTS;
            attrs.equalTurns = attrs.equalTurns || true;
            attrs.minDifficulty = attrs.minDifficulty || Clues.MIN_DIFFICULTY;
            attrs.maxDifficulty = attrs.maxDifficulty || Clues.MAX_DIFFICULTY;
            attrs.minScore = attrs.minScore || Games.DEFAULT_MIN_SCORE;
            attrs.cardLimit = attrs.cardLimit || 0;
            attrs.autoProceed = attrs.autoProceed || false;
            attrs.turnOrder = attrs.turnOrder || Games.DEFAULT_TURN_ORDER;
            attrs.recycleCards = attrs.recycleCards || false;
            attrs.showHints = attrs.showHints || false;
            attrs.comparisonPrecision = attrs.comparisonPrecision || Categories.DEFAULT_PRECISION;
            attrs.displayPrecision = attrs.displayPrecision || Categories.DEFAULT_PRECISION;
            attrs.playerLimit = attrs.playerLimit || 0;
            attrs.noJoinAfterStart = attrs.noJoinAfterStart || false;
            attrs.autoShowMore = attrs.autoShowMore || false;

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
                const updated = Games.update(id, {$addToSet: {players: userId}});
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