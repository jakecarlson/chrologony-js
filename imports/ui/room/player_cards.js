import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from "meteor/reactive-var";

import { Cards } from '../../api/Cards';

import './player_cards.html';
import './card.js';

Template.player_cards.onCreated(function player_cardsOnCreated() {
    this.expanded = new ReactiveVar(false);
});

Template.player_cards.helpers({

    dataReady() {
        return (this.game && this.player);
    },

    id() {
        return this.player._id;
    },

    profileName() {
        return this.player.profile.name;
    },

    expanded() {
        return Template.instance().expanded.get();
    },

    cards() {
        return getCards(this.game, this.player);
    },

    timelineWidth() {
        const cards = getCards(this.game, this.player);
        if (cards.count) {
            const numCards = cards.count()-2;
            return ((numCards * 5.25) + 45) + 'rem';
        } else {
            return '100%';
        }
    },

});

Template.player_cards.events({

    'click .player-name'(e, i) {
        i.expanded.set(!i.expanded.get());
    },

});


function getCards(game, player) {
    if (game && player) {
        const cards = Cards.find(
            {
                gameId: game._id,
                ownerId: player._id,
                lockedAt: {$ne: null},
            },
            {
                sort: {
                    pos: 1,
                    createdAt: -1,
                }
            }
        );
        return cards;
    } else {
        return [];
    }
}