import { Template } from 'meteor/templating';
import { ReactiveVar } from "meteor/reactive-var";

import './player_cards.html';
import './card.js';

Template.player_cards.onCreated(function player_cardsOnCreated() {
    this.expanded = new ReactiveVar(false);
});

Template.player_cards.helpers({

    dataReady() {
        return (this.game && this.player && this.player.profile && this.player.profile.name);
    },

    id() {
        return this.player._id;
    },

    expanded() {
        return Template.instance().expanded.get();
    },

    cards() {
        return this.game.playerCards(this.player._id, true);
    },

    timelineWidth() {
        if (this.game && this.player) {
            const cards = this.game.playerCards(this.player._id, true);
            if (cards.count) {
                const numCards = cards.count() - 2;
                return ((numCards * 5.25) + 45) + 'rem';
            }
        }
        return '100%';
    },

});

Template.player_cards.events({

    'click .player-name'(e, i) {
        i.expanded.set(!i.expanded.get());
    },

});