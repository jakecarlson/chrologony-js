import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { LoadingState } from "../../modules/LoadingState";

import { Votes } from '../../api/Votes';

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

    clueId() {
        return Template.instance().clue.get()._id;
    },

    isCurrent() {
        return isCurrent(this.turn, this.card);
    },

    canMoveCard() {
        return (isOwned(this.turn) && isCurrent(this.turn, this.card));
    },

    cardClasses() {
        let str = 'game-card card ';
        if (this.board) {
            str += 'board-card ';
        }
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
        return str;
    },

    hasMoreInfo() {
        const clue = Template.instance().clue.get();
        return (
            !isCurrent(this.turn, this.card) &&
            (
                clue.moreInfo ||
                clue.externalUrl ||
                clue.externalId ||
                clue.imageUrl ||
                clue.thumbnailUrl ||
                (clue.latitude && clue.longitude)
            )
        );
    },

    canSetCategories() {
        return !isCurrent(this.turn, this.card);
    },

    canEdit() {
        const clue = Template.instance().clue.get();
        return clue && clue.canEdit(this.game.categoryId);
    },

    editClueLink() {
        return FlowRouter.path('clues.categoryId.clueId', {categoryId: this.game.categoryId, clueId: this.card.clueId});
    },

    isVoteValue(value) {
        const clue = Template.instance().clue.get();
        if (clue) {
            const vote = clue.vote();
            return (vote && (vote.value == value));
        }
        return false;
    },

    score() {
        const clue = Template.instance().clue.get();
        if (clue) {
            return clue.score;
        }
        return null;
    },

});

Template.card.events({

    'click .upvote'(e, i) {
        LoadingState.start(e);
        return submitVote(this.card.clueId, 1);
    },

    'click .downvote'(e, i) {
        LoadingState.start(e);
        return submitVote(this.card.clueId, -1);
    },

});

function isOwned(turn) {
    return (turn.ownerId == Meteor.userId());
}

function isCurrent(turn, card) {
    return (turn.currentCardId == card._id);
}

function submitVote(clueId, value) {
    Meteor.call('vote.set', clueId, value, function(err, score) {
        if (!err) {
            Logger.log('Voted for Clue: ' + clueId);
        }
        LoadingState.stop();
    });
}