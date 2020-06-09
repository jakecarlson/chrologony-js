import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Sortable } from 'sortablejs';
import { LoadingState } from '../../modules/LoadingState';
// import { Insult } from "insult";

import { Cards } from '../../api/Cards';

import './board.html';
import './card.js';

Template.board.onCreated(function boardOnCreated() {

    this.autorun(() => {

        // Make sure the current turn isn't for a user who isn't in the room anymore
        if (
            this.data.turn &&
            (this.data.turn.ownerId != Meteor.userId()) &&
            (!this.data.turn.ownerId || (this.data.turn.owner().currentRoomId != this.data.room._id))
        ) {
            endTurn(this.data.game);
        }

        if (this.subscriptionsReady()) {
            Tracker.afterFlush(() => {
                const cardsSortable = new Sortable(
                    document.getElementById('playerCards'),
                    {
                        handle: '.board-card.current',
                        direction: 'horizontal',
                        filter: '.board-card .move',
                        forceFallback: true,
                        onStart: function (e) {
                            $('#playerCards').removeClass('inactive');
                        },
                        onEnd: function (e) {
                            $('#playerCards').addClass('inactive');
                            saveCardPos();
                        },
                    }
                );
            });
        }

    });

});

Template.board.helpers({

    dataReady() {
        return this.room;
    },

    turnTitle() {
        if (this.turn) {
            let title = '';
            if (this.turn.ownerId == Meteor.userId()) {
                title += 'Your';
            } else {
                if (this.turn.ownerId) {
                    title += this.turn.owner().profile.name + "'s";
                } else {
                    title += "Unknown's";
                }
            }
            title += ' Turn';
            return title;
        } else {
            return 'No Game in Progress';
        }
    },

    currentPlayerCards() {
        return getTurnCards(this.game, this.turn);
    },

    isCurrentCard(cardId) {
        return (this.turn && (this.turn.currentCardId == cardId));
    },

    cannotSubmitGuess() {
        return (
            LoadingState.active() ||
            !isCurrentPlayer(this.turn) ||
            ['waiting', 'correct', 'incorrect', 'empty'].includes(getStatus(this.turn))
        );
    },

    cannotDrawCard() {
        return (
            LoadingState.active() ||
            !isCurrentPlayer(this.turn) ||
            ['waiting', 'guessing', 'incorrect', 'empty'].includes(getStatus(this.turn))
        );
    },

    cannotEndTurn() {
        return (
            (
                !isRoomOwner(this.room) ||
                TourGuide.isActive()
            ) &&
            (
                LoadingState.active() ||
                !isCurrentPlayer(this.turn) ||
                ['waiting', 'guessing'].includes(getStatus(this.turn))
            )
        );
    },

    prompt() {
        switch(getStatus(this.turn)) {
            case 'waiting':
                return "Waiting for a game to start ...";
                break;
            case 'guessing':
                return "Move the blue card into the correct spot on the timeline.";
                break;
            case 'correct':
                return "Correct! Draw another card if you're feeling lucky, or end your turn to lock in your cards.";
                break;
            case 'incorrect':
                // return "Wrong! " + Insult() + " End your turn.";
                return "Wrong! Wallow in your defeat, then end your turn.";
                break;
            case 'empty':
                return "There are no more cards to draw. Start a new game.";
            default:
                return "Unknown state.";
        }
    },

    timelineWidth() {
        const cards = getTurnCards(this.game, this.turn);
        if (cards.count) {
            const numCards = cards.count()-2;
            return ((numCards * 5.25) + 45) + 'rem';
        } else {
            return '100%';
        }
    },

    boardClasses() {
        let str = 'card mb-4 mb-md-0';
        if (isCurrentPlayer(this.turn)) {
            str += ' border-' + getColor(this.turn);
        }
        console.log(str);
        return str;
    },

    headerClasses() {
        let str = 'card-header ';
        if (isCurrentPlayer(this.turn)) {
            str += 'bg-' + getColor(this.turn);
        } else {
            str += 'bg-light';
        }
        return str;
    },

    buttonClasses(disabled) {
        let str = 'btn';
        if (disabled && isCurrentPlayer(this.turn)) {
            str += ' btn-' + getColor(this.turn);
        } else {
            str += ' btn-light';
        }
        str += ' float-right ml-2';
        return str;
    },

});

Template.board.events({

    'click .submit-guess'(e, i) {

        LoadingState.start();
        let pos = {};
        let currentCardPos = null;
        const currentCardId = this.turn.currentCardId;

        $(i.findAll('.board-card')).each(function(n, card) {
            const id = $(card).attr('data-id');
            pos[id] = n;
            if (id === currentCardId) {
                currentCardPos = n;
            }
        });

        Meteor.call('card.submitGuess', currentCardId, currentCardPos, function(err, correct) {
            if (!err) {
                Logger.log('Guess Correct for ' + currentCardId + ': ' + correct);
            }
            LoadingState.stop();
            TourGuide.resume();
        });

    },

    'click .draw-card'(e, i) {
        LoadingState.start();
        const gameId = this.game._id;
        Meteor.call('card.draw', this.game.currentTurnId, function(err, id) {
            if (!err) {
                Logger.log("Created Card: " + id);
            }
            saveCardPos();
            LoadingState.stop();
        });
    },

    'click .end-turn'(e, i) {
        LoadingState.start(e);
        endTurn(this.game);
    },

    'click .move-left'(e, i) {
        e.preventDefault();
        const currentCol = $(e.target).closest('.clue-col');
        const destinationCol = currentCol.prev();
        if (destinationCol.length > 0) {
            currentCol.insertBefore(destinationCol);
            saveCardPos();
        }
    },

    'click .move-right'(e, i) {
        e.preventDefault();
        const currentCol = $(e.target).closest('.clue-col');
        const destinationCol = currentCol.next();
        if (destinationCol.length > 0) {
            currentCol.insertAfter(destinationCol);
            saveCardPos();
        }
    },

});

function isCurrentPlayer(turn) {
    return (turn && (turn.ownerId == Meteor.userId()));
}

function isRoomOwner(room) {
    return (room.ownerId == Meteor.userId());
}

function getTurnCards(game, turn) {
    if (game && turn) {
        return Cards.find(
            {
                gameId: game._id,
                ownerId: turn.ownerId,
                $or: [
                    {turnId: turn._id},
                    {lockedAt: {$ne: null}},
                ]
            },
            {
                sort: {
                    pos: 1,
                    createdAt: -1,
                }
            }
        );
    } else {
        return [];
    }
}

function saveCardPos() {

    const cards = $('#playerCards').find('.board-card');
    let pos = {};
    cards.each(function(n, card) {
        pos[$(card).attr('data-id')] = n;
    });

    Meteor.call('card.setPositions', pos, function(err, updated) {
        if (!err) {
            Logger.log("Card Positions Updated: " + updated);
        }
    });

}

function endTurn(game) {
    Logger.log('End Turn: ' + game.currentTurnId);
    const gameId = game._id;
    Meteor.call('turn.next', gameId, function(err, id) {
        if (!err) {
            Logger.log("Start Turn: " + id);
        }
        LoadingState.stop();
        TourGuide.resume();
    });
}

function getStatus(turn) {
    if (turn) {
        if (turn.currentCardId) {
            return 'guessing';
        } else {
            if (turn.lastCardCorrect === true) {
                return 'correct';
            } else if (turn.lastCardCorrect === false) {
                return 'incorrect';
            } else {
                return 'empty';
            }
        }
    } else {
        return 'waiting';
    }
}

function getColor(turn) {
    switch(getStatus(turn)) {
        case 'guessing':
            return "primary";
            break;
        case 'correct':
            return "success";
            break;
        case 'incorrect':
            return "danger";
            break;
        case 'empty':
            return "light";
            break;
        default:
            return "light";
    }
};