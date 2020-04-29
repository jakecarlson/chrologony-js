import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from "meteor/session";
// import { Insult } from "insult";

import { Cards } from '../api/cards';

import './board.html';
import './card.js';

Template.board.onCreated(function boardOnCreated() {

    this.autorun(() => {

        this.subscribe('turns', this.data.room.currentGameId);
        this.subscribe('cards', this.data.room.currentGameId);

        if (this.subscriptionsReady()) {
            Tracker.afterFlush(() => {
                $("#currentPlayerCards").sortable({
                    items: ".clue-col",
                    axis: "x",
                    cancel: ".clue-card:not(.current), .clue-card:not(.owned)",
                    handle: ".clue-card",
                    tolerance: "pointer",
                    containment: "#board",
                    delay: 100,
                    revert: 100,
                    helper: "clone",
                    scroll: false,
                    cursor: 'grabbing',
                    update: function(event, ui) {
                        var cards = $(event.target).find('.clue-card');
                        var pos = {};
                        cards.each(function(n, card) {
                            pos[$(card).attr('data-id')] = n;
                        });
                        Meteor.call('card.pos', pos, function(error, updated) {
                            if (!error) {
                                console.log("Card Positions Updated: " + updated);
                            }
                        });
                    },
                });
            });
        }

    });

});

Template.board.helpers({

    turnTitle() {
        if (this.turn) {
            let title = '';
            if (this.turn.userId == Meteor.userId()) {
                title += 'Your';
            } else {
                let user = Meteor.users.findOne(this.turn.userId);
                title += user.username + "'s";
            }
            title += ' Turn';
            return title;
        } else {
            return 'No Game in Progress';
        }
    },

    currentPlayerCards() {
        if (this.game && this.turn) {
            return Cards.find(
                {
                    gameId: this.game._id,
                    userId: this.turn.userId,
                    $or: [
                        {turnId: this.turn._id},
                        {lockedAt: {$ne: null}},
                    ]
                },
                {
                    sort: {
                        pos: 1,
                        /*correct: -1,
                        'clue.date': 1,*/
                    }
                }
            );
        } else {
            return [];
        }
    },

    isCurrentCard(cardId) {
        return (this.turn && (this.turn.currentCardId == cardId));
    },

    cannotSubmitGuess() {
        return (Session.get('loading') || !isCurrentPlayer(this.turn) || ['waiting', 'correct', 'incorrect'].includes(getStatus(this.turn)));
    },

    cannotDrawCard() {
        return (Session.get('loading') || !isCurrentPlayer(this.turn) || ['waiting', 'guessing', 'incorrect'].includes(getStatus(this.turn)));
    },

    cannotEndTurn() {
        return (Session.get('loading') || !isCurrentPlayer(this.turn) || ['waiting', 'guessing'].includes(getStatus(this.turn)));
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
            default:
                return "Unknown state.";
        }
    },

});

Template.board.events({

    'click .submit-guess'(e, i) {
        let pos = {};
        let currentCardPos = null;
        const currentCardId = this.turn.currentCardId;
        $(i.findAll('.clue-card')).each(function(n, card) {
            let id = $(card).attr('data-id');
            pos[id] = n;
            if (id === currentCardId) {
                currentCardPos = n;
            }
        });
        Meteor.call('card.pos', pos, function(error, updated) {
            if (!error) {
                console.log("Card Positions Updated: " + updated);
            }
        });
        Meteor.call('card.submit', {gameId: this.game._id, turnId: this.turn._id, cardId: currentCardId, pos: currentCardPos}, function(error, correct) {
            if (!error) {
                console.log("Guess Correct?: " + correct);
            }
        });
    },

    'click .draw-card'(e, i) {
        let gameId = this.game._id;
        Meteor.call('card.draw', {turnId: this.game.currentTurnId, gameId: gameId}, function(error, id) {
            if (!error) {
                console.log("Created Card: " + id);
                Meteor.subscribe('cards', gameId);
            }
        });
    },

    'click .end-turn'(e, i) {
        console.log('End Turn: ' + this.game.currentTurnId);
        Session.set('loading', true);
        let gameId = this.game._id;
        Meteor.call('turn.next', gameId, function(error, id) {
            if (!error) {
                console.log("Start Turn: " + id);
                Meteor.subscribe('turns', gameId);
                Meteor.subscribe('cards', gameId);
                Session.set('loading', false);
            }
        });
    },

});

function getStatus(turn) {
    if (turn) {
        if (turn.currentCardId) {
            return 'guessing';
        } else if (turn.lastCardCorrect) {
            return 'correct';
        } else {
            return 'incorrect';
        }
    } else {
        return 'waiting';
    }
}

function isCurrentPlayer(turn) {
    return (turn && (turn.userId == Meteor.userId()));
}