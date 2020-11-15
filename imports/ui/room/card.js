import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { LoadingState } from "../../modules/LoadingState";

import './card.html';

const DIFFICULTY_NAMES = [
    'Easy',
    'Moderate',
    'Hard',
];

Template.card.onCreated(function boardOnCreated() {
    this.clue = new ReactiveVar(null);
    this.autorun(() => {
        this.clue.set(this.data.card.clue());
        Tracker.afterFlush(() => {
            $(function() {
                $('[data-toggle="tooltip"]').tooltip();
            });
        });
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
        return Template.instance().clue.get().formattedDate(this.game.displayPrecision);
    },

    year() {
        return Template.instance().clue.get().shortDate(this.game.displayPrecision);
    },

    showTime() {
        return Helpers.isTimePrecision(this.game.displayPrecision);
    },

    time() {
        return Template.instance().clue.get().formattedTime(this.game.displayPrecision);
    },

    description() {
        return Template.instance().clue.get().description;
    },

    clueId() {
        return Template.instance().clue.get()._id;
    },

    hint() {
        return Template.instance().clue.get().hint;
    },

    showHint() {
        return (this.game && this.game.showHints && Template.instance().clue.get().hint);
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
                    str += ' current bg-active text-white'
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
        return hasMoreInfo(Template.instance(), this.turn, this.card);
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

    difficulty() {
        return getDifficultyLevel(Template);
    },

    difficultyName() {
        const level = getDifficultyLevel(Template);
        return DIFFICULTY_NAMES[level - 1];
    },

    difficultyDots() {
        const level = getDifficultyLevel(Template);
        let dots = [];
        for (let i = 0; i < level; ++i) {
            dots.push(i);
        }
        return dots;
    },

    isAnonymous() {
        return Helpers.isAnonymous();
    },

    showMenu() {
        return (!Helpers.isGuest() && !Helpers.isAnonymous()) || hasMoreInfo(Template.instance(), this.turn, this.card);
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
    return (turn && (turn.ownerId == Meteor.userId()));
}

function isCurrent(turn, card) {
    return (Session.get('waiting') || (turn && (turn.currentCardId == card._id)));
}

function submitVote(clueId, value) {
    Meteor.call('vote.set', clueId, value, function(err, score) {
        if (!err) {
            Logger.log('Voted for Clue: ' + clueId);
        }
        LoadingState.stop();
    });
}

function getDifficultyLevel(template) {
    const clue = template.instance().clue.get();
    if (clue && clue.difficulty) {
        return Math.round(clue.difficulty / .5) + 1;
    }
    return 1;
}

function hasMoreInfo(i, turn, card) {
    const clue = Template.instance().clue.get();
    return (
        !isCurrent(turn, card) &&
        (
            clue.moreInfo ||
            clue.externalUrl ||
            clue.externalId ||
            clue.imageUrl ||
            clue.thumbnailUrl ||
            (clue.latitude && clue.longitude)
        )
    );
}