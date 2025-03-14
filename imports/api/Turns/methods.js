import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { RecordId } from "../../startup/validations";
import { Permissions } from '../../modules/Permissions';

import { Games } from '../Games';
import { Cards } from '../Cards';
import { Turns } from "./index";

Meteor.methods({

    // Update
    'turn.setCard'(id, cardId, lastCardCorrect) {

        check(id, RecordId);
        check(cardId, Match.OneOf(null, RecordId));
        check(lastCardCorrect, Match.OneOf(null, Boolean));
        Permissions.authenticated();
        if (cardId) {
            Permissions.check((Turns.findOne(id).ownerId == Cards.findOne(cardId).ownerId));
        }

        Logger.log('Update Turn ' + id + ' Card: ' + cardId);

        const updated = Turns.update(
            id,
            {
                $set: {
                    currentCardId: cardId,
                    lastCardCorrect: lastCardCorrect,
                }
            }
        );
        if (!updated) {
            throw new Meteor.Error('turn-not-updated', 'Could not update a turn.');
        }

        return updated;

    },

});

if (Meteor.isServer) {

    Meteor.methods({

        // Next Turn
        'turn.next'(gameId) {

            check(gameId, RecordId);
            Permissions.authenticated();

            // Check that the user is allowed
            const game = Games.findOne(gameId);
            const turn = game.currentTurn();
            if (!game.currentTurnId || (turn.ownerId != Meteor.userId())) {
                Permissions.owned(game);
            }

            // End the current turn
            let endGame = false;
            if (game.currentTurnId) {

                // Set the end time
                const updated = Turns.update(
                    game.currentTurnId,
                    {
                        $set: {
                            endedAt: new Date(),
                        }
                    }
                );
                if (updated) {
                    Logger.log('Ended Turn: ' + game.currentTurnId)
                } else {
                    throw new Meteor.Error('turn-not-updated', 'Could not end a turn.');
                }

                // Lock all current turn cards
                const cards = turn.cards();
                const correctCards = turn.cards(true);
                if (cards.count() === correctCards.count()) {
                    correctCards.forEach(function(card) {
                        Meteor.call('card.lock', card._id);
                    });
                }

                // If a win condition is defined, see if we've met it
                if (turn && game.winPoints) {

                    // If we need to have equal turns, find out if anyone has won and if everyone has had equal turns
                    if (game.equalTurns) {
                        const leader = game.calculateCurrentLeader();
                        if (leader && (leader.cards >= game.winPoints)) {
                            let equalTurns = true;
                            game.getPlayerTurnCounts().forEach(function(player) {
                                if (player.turns < leader.turns) {
                                    equalTurns = false;
                                    return;
                                }
                            });
                            endGame = equalTurns;
                        }

                        // Otherwise end the game if the current player has enough cards
                    } else {
                        const numLockedCards = game.playerCards(turn.ownerId, true).count();
                        endGame = (numLockedCards >= game.winPoints);
                    }

                    // End the game if the conditions are met
                    if (endGame) {
                        Meteor.call('game.end', game._id, false);
                    }

                    // If the game already ended, don't try to end it again
                } else if (game.endedAt) {
                    endGame = true;
                }

            }

            // If not short-circuited by game end, continue on to start the next turn ...
            if (!endGame) {

                const nextPlayer = game.getNextPlayer();

                Logger.log("Next Turn Belongs To: " + nextPlayer._id);
                try {

                    const turnId = Turns.insert({
                        gameId: gameId,
                        ownerId: nextPlayer._id,
                        startedAt: new Date(),
                    });

                    const leader = game.calculateCurrentLeader();
                    const attrs = {
                        currentTurnId: turnId,
                        currentRound: game.calculateCurrentRound(),
                        currentLeaderId: (leader ? leader._id : null),
                    };
                    Meteor.call('game.update', gameId, attrs);

                    Meteor.call('card.draw', turnId);

                    return turnId;

                } catch(err) {
                    throw new Meteor.Error('turn-not-inserted', 'Could not create a turn.', err);
                }

            }

            return null;

        },

    });

}