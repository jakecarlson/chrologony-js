import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { RecordId } from "../../startup/validations";
import { Permissions } from '../../modules/Permissions';
import { Promise } from "meteor/promise";

import { Clues } from "../Clues";
import { Turns } from "../Turns";
import { Cards } from "./index";

Meteor.methods({

    // Set the card positions
    'card.setPositions'(cards) {

        check(cards, Object);
        Permissions.authenticated();

        Logger.log("Card Positions: " + JSON.stringify(cards));

        let numUpdated = 0;
        for (const [id, pos] of Object.entries(cards)) {
            check(id, RecordId);
            check(pos, Match.Integer);
            Permissions.owned(Cards.findOne(id));
            let updated = Cards.update(
                {
                    _id: id,
                    ownerId: Meteor.userId(),
                },
                {
                    $set: {
                        pos: pos,
                    }
                }
            );
            if (updated) {
                numUpdated += updated;
            } else {
                throw new Meteor.Error('card-not-updated', 'Could not update position of a card.');
            }

        }

        return numUpdated;

    },

    // Lock Card
    'card.lock'(id) {

        check(id, RecordId);
        Permissions.authenticated();

        // Double check that the card was correct before locking
        const card = Cards.findOne(id);
        Permissions.check(card.correct);

        Logger.log('Lock Card: ' + id);

        // If there is an ID, this is an update
        const updated = Cards.update(
            {
                _id: id,
                ownerId: Meteor.userId(),
            },
            {
                $set: {
                    lockedAt: new Date(),
                }
            }
        );

        return updated;

    },

});

if (Meteor.isServer) {

    Meteor.methods({

        // Draw Card
        'card.draw'(turnId) {

            check(turnId, RecordId);
            Permissions.authenticated();
            const turn = Turns.findOne(turnId);
            const game = turn.game();
            Permissions.check(game.hasPlayer(turn.ownerId));

            // If the game has a turn card limit, check whether the user is allowed to draw
            Permissions.check(!turn.hasReachedCardLimit());

            // Draw the card -- defer this to a helper defined below because it's recursive
            const cardId = drawCard(turn, game);
            Logger.log("Card ID: " + cardId);

            Meteor.call('turn.setCard', turnId, cardId, null);

            return cardId;

        },

        // Submit Guess
        'card.submitGuess'(id, pos) {

            check(id, RecordId);
            check(pos, Match.Integer);
            Permissions.authenticated();

            // Get the card and determine if the guess is correct
            const card = Cards.findOne(id);
            Permissions.owned(card);
            const correct = guessIsCorrect(card, pos);

            Logger.log("Card Guess Correct?: " + JSON.stringify(correct));

            // Null out the current card ID
            Meteor.call('turn.setCard', card.turn()._id, null, correct);

            Logger.log('Update Card: ' + id + ' ' + JSON.stringify({correct: correct}));

            // Update the card
            const updated = Cards.update(
                id,
                {
                    $set: {
                        correct: correct,
                        guessedAt: new Date(),
                    }
                }
            );
            if (!updated) {
                throw new Meteor.Error('card-not-updated', 'Could not submit a card guess.');
            }

            const difficulty = Meteor.call('clue.calculateDifficulty', card.clueId);
            Logger.log("Updated Clue Difficulty: " + difficulty);

            // Meteor._sleepForMs(2000);
            return correct;

        },

    });

    // Draw a new card
    function drawCard(turn, game) {

        // Initialize selector for past clues in the current game
        let usedSelector = {
            gameId: game._id,
        };

        // If the recycle cards options is set, only exclude locked and current turn cards
        if (game.recycleCards) {
            usedSelector.$or = [
                {lockedAt: {$ne: null}},
                {turnId: turn._id},
            ];
        }

        // Get an array of clue IDs that have been used already for this game
        const usedClueIds = Cards.find(usedSelector).map(function(i) { return i.clueId; });

        Logger.log('Used Clues: ' + JSON.stringify(usedClueIds));

        // Initialize the selector
        let selector = {
            active: true,
            categories: game.categoryId,
        };
        if (usedClueIds.length > 0) {
            selector._id = {$nin: usedClueIds};
        }

        // Narrow by difficulty
        const difficulties = {
            1: {min: 0, max: .33},
            2: {min: .34, max: .66},
            3: {min: .67, max: 1},
        }
        selector.difficulty = {
            $gte: difficulties[game.minDifficulty].min,
            $lte: difficulties[game.maxDifficulty].max,
        };

        // Narrow by score
        if (game.minScore) {
            selector.score = {$gte: game.minScore};
        }

        // Query for a random eligible clue
        const possibleClues = Promise.await(
            Clues.rawCollection().aggregate(
                [
                    {$match: selector},
                    {$sample: {size: 1}},
                ]
            ).toArray()
        );
        if (possibleClues.length == 0) {
            Logger.log("No more cards to draw!!!");
            return null;
        }
        const randomClue = possibleClues[0];

        // Set the card doc
        const card = {
            gameId: turn.gameId,
            turnId: turn._id,
            clueId: randomClue._id,
            ownerId: turn.ownerId,
        };

        // Figure out whether this is the first card
        const userCards = Cards.find(
            {
                gameId: turn.gameId,
                ownerId: turn.ownerId,
            }
        ).fetch();
        const firstCard = (userCards.length == 0);

        // If it's the first card, automatically mark it correct
        if (firstCard) {
            card.correct = true;
            card.lockedAt = new Date();
        }

        Logger.log('Insert Card: ' + JSON.stringify(card));

        // Add the card
        try {

            const cardId = Cards.insert(card);

            // If it's the first card, draw another
            if (firstCard) {
                return drawCard(turn, game);
            } else {
                return cardId;
            }

        } catch(err) {
            throw new Meteor.Error('card-not-inserted', 'Could not create a card.', err);
        }

    }

    // Determine if the guess is correct
    function guessIsCorrect(card, pos) {

        const cards = Cards.find(
            {
                gameId: card.turn().gameId,
                ownerId: Meteor.userId(),
                $or: [
                    {turnId: card.turn()._id},
                    {lockedAt: {$ne: null}},
                ],
            },
            {
                sort: {
                    pos: 1,
                    createdAt: -1,
                }
            }
        ).fetch();

        let correct = true;
        let comparisonStr = 'Comparison: ';

        // Save the guess date
        const currentClue = cards[pos].clue();
        const precision = card.game().comparisonPrecision;
        const guessDate = currentClue.dateObj(precision);

        // If there is a previous card, validate the guess against it
        if (pos > 0) {
            const previousClue = cards[pos-1].clue();
            const previousDate = previousClue.dateObj(precision);
            comparisonStr += previousDate.utc().format() + ' <= ';
            if (guessDate.isBefore(previousDate)) {
                correct = false;
            }
        }

        comparisonStr += guessDate.utc().format();

        // If there is a next card, validate the guess against it
        if (correct && (pos < (cards.length-1))) {
            const nextClue = cards[pos+1].clue();
            const nextDate = nextClue.dateObj(precision);
            comparisonStr += ' <= ' + nextDate.utc().format();
            if (guessDate.isAfter(nextDate)) {
                correct = false;
            }
        }

        Logger.log(comparisonStr);

        return correct

    }

}