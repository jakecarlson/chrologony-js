import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './card.html';

Template.card.onCreated(function boardOnCreated() {
    this.clue = new ReactiveVar(null);
    this.autorun(() => {
        this.clue.set(this.data.card.clue());
    });
});

Template.card.helpers({

    dataReady() {
        return (this.card && Template.instance().clue && Template.instance().clue.get());
    },

    id() {
        return this.card._id;
    },

    date() {
        return Template.instance().clue.get().formattedDate();
    },

    year() {
        return Template.instance().clue.get().year();
    },

    description() {
        return Template.instance().clue.get().description;
    },

    hint() {
        return Template.instance().clue.get().hint;
    },

    isCurrent() {
        return isCurrent(this.turn, this.card);
    },

    canMoveCard() {
        return (!this.compact && isOwned(this.turn) && isCurrent(this.turn, this.card));
    },

    cardClasses() {
        let str = '';
        if (this.compact) {
            str += 'bg-light text-secondary';
        } else {
            str += 'card board-card';
            if (isOwned(this.turn)) {
                str += ' owned';
            }
            if (this.card.lockedAt != null) {
                str += ' locked bg-success text-white';
            } else {
                if (this.card.turnId == this.turn._id) {
                    str += ' turn';
                    if (isCurrent(this.turn, this.card)) {
                        str += ' current bg-primary text-white'
                    } else {
                        if (this.card.correct) {
                            str += ' correct bg-warning';
                        } else {
                            str += ' incorrect bg-danger text-white'
                        }

                    }
                }
            }
        }
        return str;
    },

});

Template.card.events({

});

function isOwned(turn) {
    return (turn.ownerId == Meteor.userId());
}

function isCurrent(turn, card) {
    return (turn.currentCardId == card._id);
}