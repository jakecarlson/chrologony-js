import { Meteor } from 'meteor/meteor';

import { Games } from '../Games';
import { Cards } from '../Cards';
import { Turns } from "./index";

Turns.helpers({

    game() {
        return Games.findOne(this.gameId);
    },

    cards(correct = null) {
        let selector = {
            turnId: this._id,
        };
        if (correct !== null) {
            selector.correct = correct;
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

    currentCard() {
        return Cards.findOne(this.currentCardId);
    },

    owner() {
        return Meteor.users.findOne(this.ownerId);
    },

    hasReachedCardLimit() {
        const game = this.game();
        return (game && (game.cardLimit > 0) && (this.cards().count() >= game.cardLimit));
    },

});