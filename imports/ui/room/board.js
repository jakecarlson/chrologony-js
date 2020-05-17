import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Sortable } from 'sortablejs';
import { LoadingState } from '../../startup/LoadingState';
// import { Insult } from "insult";

import { Cards } from '../../api/cards';
import { Turns } from "../../api/turns";

import './board.html';
import './card.js';

Template.board.onCreated(function boardOnCreated() {

    this.autorun(() => {

        // Make sure the current turn isn't for a user who isn't in the room anymore
        if (this.data.turn && (this.data.turn.owner != Meteor.userId())) {
            const turnUser = Meteor.users.findOne(this.data.turn.owner);
            if (!turnUser || (turnUser.currentRoomId != this.data.room._id)) {
                endTurn(this.data.game);
            }
        }

        if (this.subscriptionsReady()) {
            Tracker.afterFlush(() => {
                const cardsSortable = new Sortable(
                    document.getElementById('playerCards'),
                    {
                        handle: '.clue-card',
                        direction: 'horizontal',
                        filter: '.clue-card:not(.current), .clue-card:not(.owned), .clue-card .move',
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

    turnTitle() {
        if (this.turn) {
            let title = '';
            if (this.turn.owner == Meteor.userId()) {
                title += 'Your';
            } else {
                const user = Meteor.users.findOne(this.turn.owner);
                if (user) {
                    title += user.username + "'s";
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
        return (LoadingState.active() || !isCurrentPlayer(this.turn) || ['waiting', 'correct', 'incorrect', 'empty'].includes(getStatus(this.turn)));
    },

    cannotDrawCard() {
        return (LoadingState.active() || !isCurrentPlayer(this.turn) || ['waiting', 'guessing', 'incorrect', 'empty'].includes(getStatus(this.turn)));
    },

    cannotEndTurn() {
        return (!isRoomOwner(this.room) && (LoadingState.active() || !isCurrentPlayer(this.turn) || ['waiting', 'guessing'].includes(getStatus(this.turn))));
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

    color() {
        switch(getStatus(this.turn)) {
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
                return "dark";
                break;
            default:
                return "light";
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

    isTurnOwner() {
        return isCurrentPlayer(this.turn);
    },

});

Template.board.events({

    'click .submit-guess'(e, i) {

        LoadingState.start();
        let pos = {};
        let currentCardPos = null;
        const currentCardId = this.turn.currentCardId;

        $(i.findAll('.clue-card')).each(function(n, card) {
            const id = $(card).attr('data-id');
            pos[id] = n;
            if (id === currentCardId) {
                currentCardPos = n;
            }
        });

        Meteor.call('card.submitGuess', currentCardId, currentCardPos, function(error, correct) {
            if (!error) {
                Logger.log('Guess Correct for: ' + currentCardId + ': ' + correct);
            }
            LoadingState.stop();
        });

    },

    'click .draw-card'(e, i) {
        LoadingState.start();
        const gameId = this.game._id;
        Meteor.call('card.draw', this.game.currentTurnId, function(error, id) {
            if (!error) {
                Logger.log("Created Card: " + id);
                Meteor.subscribe('cards', gameId);
                Meteor.subscribe('cardClues', gameId);
            }
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

function isCurrentPlayer(turn) {
    return (turn && (turn.owner == Meteor.userId()));
}

function isRoomOwner(room) {
    return (room.owner == Meteor.userId());
}

function getTurnCards(game, turn) {
    if (game && turn) {
        return Cards.find(
            {
                gameId: game._id,
                owner: turn.owner,
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

    const cards = $('#playerCards').find('.clue-card');
    let pos = {};
    cards.each(function(n, card) {
        pos[$(card).attr('data-id')] = n;
    });

    Meteor.call('card.setPositions', pos, function(error, updated) {
        if (!error) {
            Logger.log("Card Positions Updated: " + updated);
        }
    });

}

function endTurn(game) {
    Logger.log('End Turn: ' + game.currentTurnId);
    const gameId = game._id;
    Meteor.call('turn.next', gameId, function(error, id) {
        if (!error) {
            Logger.log("Start Turn: " + id);
            Meteor.subscribe('turns', gameId);
            Meteor.subscribe('cards', gameId);
            Meteor.subscribe('cardClues', gameId);
        }
        LoadingState.stop();
    });
}