import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import Sortable from 'sortablejs';
import { LoadingState } from '../../modules/LoadingState';

// import { Insult } from "insult";

import './board.html';
import './card.js';
import {Session} from "meteor/session";
import {FlowRouter} from "meteor/ostrio:flow-router-extra";

Template.board.onCreated(function boardOnCreated() {

    this.autorun(() => {

        // Make sure the current turn isn't for a user who isn't in the game anymore
        if (
            this.data.turn &&
            (this.data.turn.ownerId != Meteor.userId()) &&
            (!this.data.turn.ownerId || (this.data.turn.owner().currentGameId != this.data.game._id))
        ) {
            endTurn(this.data.game);
        }

        if (this.subscriptionsReady()) {
            Tracker.afterFlush(() => {
                const cardsSortable = new Sortable(
                    document.getElementById('boardCards'),
                    {
                        handle: '.board-card.current.owned',
                        direction: 'horizontal',
                        filter: '.board-card .move',
                        forceFallback: true,
                        onStart: function (e) {
                            $('#boardCards').removeClass('inactive');
                        },
                        onEnd: function (e) {
                            $('#boardCards').addClass('inactive');
                            saveCardPos();
                        },
                    }
                );
                this.cardTimer = $('.card-timer');
            });
        }

    });

});

Template.board.helpers({

    dataReady() {
        return this.game;
    },

    boardTitle() {
        if (this.turn) {
            let title = '';
            if (this.turn.ownerId == Meteor.userId()) {
                title += 'Your';
            } else {
                let name = 'Unknown';
                const owner = this.turn.owner();
                if (owner) {
                    name = owner.name();
                }
                title += name + "'s";
            }
            title += ' Turn';
            return title;
        } else if (gameHasEnded(this.game)) {
            return 'Game has Ended';
        } else {
            return 'Waiting ...';
        }
    },

    currentPlayerCards() {
        if (this.game && this.turn) {
            return this.game.playerCards(this.turn.ownerId);
        }
        return [];
    },

    isCurrentCard(cardId) {
        return (this.turn && (this.turn.currentCardId == cardId));
    },

    cannotSubmitGuess() {
        return (
            LoadingState.active() ||
            !isCurrentPlayer(this.turn) ||
            gameHasEnded(this.game) ||
            ['waiting', 'correct', 'incorrect', 'empty'].includes(getStatus(this.turn))
        );
    },

    cannotDrawCard() {
        return (
            LoadingState.active() ||
            !this.turn ||
            !isCurrentPlayer(this.turn) ||
            gameHasEnded(this.game) ||
            ['waiting', 'guessing', 'incorrect', 'empty'].includes(getStatus(this.turn)) ||
            this.turn.hasReachedCardLimit()
        );
    },

    cannotEndTurn() {
        return (
            gameHasEnded(this.game) ||
            (
                (
                    !isGameOwner(this.game) ||
                    Helpers.isAnonymous() ||
                    TourGuide.isActive()
                ) &&
                (
                    LoadingState.active() ||
                    !isCurrentPlayer(this.turn) ||
                    ['waiting', 'guessing'].includes(getStatus(this.turn))
                )
            )
        );
    },

    prompt() {
        switch(getStatus(this.turn)) {
            case 'waiting':
                if (this.game.ownerId == Meteor.userId()) {
                    return "Click on the 'Start' button to start the game.";
                } else {
                    return "Waiting for owner to start the game ...";
                }
                break;
            case 'guessing':
                if (this.game.cardTime) {
                    return '';
                }
                return "Move the blue card to the correct spot on the timeline.";
                break;
            case 'correct':
                let str = "Correct! ";
                if (this.turn.hasReachedCardLimit()) {
                    str += "You've reached your card limit. Please end your turn.";
                } else {
                    str += "Draw another card if you're feeling lucky, or end your turn to lock in your cards.";
                }
                return str;
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
        if (this.game && this.turn) {
            const cards = this.game.playerCards(this.turn.ownerId);
            if (cards.count) {
                const numCards = cards.count() - 2;
                return ((numCards * 5.25) + 45) + 'rem';
            }
        }
        return '100%';
    },

    boardClasses() {
        let str = 'card ';
        if (gameHasEnded(this.game)) {
            if (isGameWinner(this.game)) {
                str += 'border-success';
            } else {
                str += 'border-danger';
            }
        } else if (isCurrentPlayer(this.turn)) {
            str += 'border-' + getColor(this.turn);
        }
        return str;
    },

    headerClasses() {
        let str = 'card-header ';
        if (gameHasEnded(this.game)) {
            if (isGameWinner(this.game)) {
                str += 'bg-success';
            } else {
                str += 'bg-danger';
            }
        } else if (isCurrentPlayer(this.turn)) {
            str += 'bg-' + getColor(this.turn);
        }
        return str;
    },

    buttonClasses(disabled) {
        let str = 'btn ';
        if (gameHasEnded(this.game)) {
            if (isGameWinner(this.game)) {
                str += 'btn-success';
            } else {
                str += 'btn-danger';
            }
        } else if (disabled && isCurrentPlayer(this.turn)) {
            str += 'btn-' + getColor(this.turn);
        } else {
            str += 'btn-light';
        }
        return str;
    },

    winnerClasses() {
        let str = 'fa fa-certificate bg-winner '
        if (isGameWinner(this.game)) {
            str += 'text-success';
        } else {
            str += 'text-danger';
        }
        return str;
    },

    gameHasEnded() {
        return gameHasEnded(this.game);
    },

    winner() {
        if (this.game && this.game.winner()) {
            if (this.game.winnerId == Meteor.userId()) {
                return 'You';
            } else {
                return this.game.winner().name();
            }
        }
        return 'Nobody';
    },

    showCardTimer() {
        return (this.game && this.game.cardTime && this.turn && !cardIsGuessed(this.turn.currentCard()));
    },

    cardTimer() {
        if (this.game && this.game.cardTime && this.turn && (getStatus(this.turn) == 'guessing')) {
            if (!cardIsGuessed(this.turn.currentCard())) {
                Template.instance().cardTimer.text(formatCountdown(this.game.cardTime));
                countdownCard(Template.instance());
            }
        }
        return '';
    },

    isAnonymous() {
        return Helpers.isAnonymous();
    },

    currentGame() {
        return this.game;
    },

    currentTurn() {
        return this.turn;
    },

    categoryName() {
        return this.game.category().name;
    },

    isOwner() {
        return (this.game.ownerId == Meteor.userId());
    },

});

Template.board.events({

    'click .submit-guess'(e, i) {

        Session.set('waiting', true);
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

        const self = this;
        Meteor.call('card.submitGuess', currentCardId, currentCardPos, function(err, correct) {
            if (!err) {
                Logger.log('Guess Correct for ' + currentCardId + ': ' + correct);
                if (correct && self.game.autoProceed) {
                    if (self.turn.hasReachedCardLimit()) {
                        endTurn(self.game);
                    } else {
                        drawCard(self.game.currentTurnId);
                    }
                }
            } else {
                throw new Meteor.Error('card-not-submitted', 'Could not submit a guess for the card.', err);
            }
            TourGuide.resume();
        });

        Helpers.updateLastActivity();

    },

    'click .draw-card'(e, i) {
        drawCard(this.game.currentTurnId);
        Helpers.updateLastActivity();
    },

    'click .end-turn'(e, i) {
        LoadingState.start(e);
        endTurn(this.game);
        Helpers.updateLastActivity();
    },

    'click .move-back'(e, i) {
        e.preventDefault();
        const currentCol = $(e.target).closest('.clue-col');
        const destinationCol = currentCol.prev();
        if (destinationCol.length > 0) {
            currentCol.insertBefore(destinationCol);
            saveCardPos();
        }
    },

    'click .move-forward'(e, i) {
        e.preventDefault();
        const currentCol = $(e.target).closest('.clue-col');
        const destinationCol = currentCol.next();
        if (destinationCol.length > 0) {
            currentCol.insertAfter(destinationCol);
            saveCardPos();
        }
    },

    'click #playAgain'(e, i) {

        LoadingState.start(e);

        Meteor.call('game.clone', this.game._id, function(err, id) {

            if (!err) {

                Logger.log("Cloned Game: " + id);
                if (Helpers.isAnonymous()) {
                    Session.set('currentGameId', id);
                    Helpers.subscribe(i, 'anonymousGame', id);
                } else {
                    Session.set('lastOwnedGameId', id);
                    Helpers.subscribe(i, 'games', Helpers.currentAndPreviousGameIds());
                    setTimeout(function() {
                        Flasher.success('You have successfully created a copy of the previous game.');
                        FlowRouter.go('game', {id: id});
                    }, 250);
                }

            } else {
                throw new Meteor.Error('game-not-cloned', 'Could not clone the game.', err);
            }

            LoadingState.stop();

        });

    },

});

function isCurrentPlayer(turn) {
    return (turn && (turn.ownerId == Meteor.userId()));
}

function isGameOwner(game) {
    return (game.ownerId == Meteor.userId());
}

function saveCardPos() {

    const cards = $('#boardCards').find('.board-card');
    let pos = {};
    cards.each(function(n, card) {
        pos[$(card).attr('data-id')] = n;
    });

    Meteor.call('card.setPositions', pos, function(err, updated) {
        if (!err) {
            Logger.log("Card Positions Updated: " + updated);
        } else {
            throw new Meteor.Error('card-positions-not-set', 'Could not set card positions.', err);
        }
    });

}

function drawCard(turnId) {
    LoadingState.start();
    Meteor.call('card.draw', turnId, function(err, id) {
        if (!err) {
            Logger.log("Created Card: " + id);
        } else {
            throw new Meteor.Error('card-not-drawn', 'Could not draw a card.', err);
        }
        saveCardPos();
        LoadingState.stop();
    });
}

function endTurn(game) {
    Session.set('waiting', true);
    Logger.log('End Turn: ' + game.currentTurnId);
    const gameId = game._id;
    Meteor.call('turn.next', gameId, function(err, id) {
        if (!err) {
            Logger.log("Start Turn: " + id);
        } else {
            throw new Meteor.Error('turn-not-set', 'Could not set a turn.', err);
        }
        Session.set('waiting', false);
        LoadingState.stop();
        TourGuide.resume();
    });
}

function getStatus(turn) {
    if (turn) {
        if (Session.get('waiting') || turn.currentCardId) {
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
            return "active";
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

function gameHasEnded(game) {
    return (game && game.endedAt);
}

function isGameWinner(game) {
    return (game && (game.winnerId == Meteor.userId()));
}

function formatCountdown(s) {
    if (s < 0) {
        return '';
    }
    return Math.floor(s/60) + ':' + ("00" + (s % 60)).slice(-2);
}

function countdownCard(i) {
    Meteor.setTimeout(function() {
        const card = i.data.turn.currentCard();
        if (card && !cardIsGuessed(card) && (!i.data.game.endedAt)) {
            const seconds = moment.utc(card.createdAt).unix() + i.data.game.cardTime - moment.utc().unix();
            i.cardTimer.text(formatCountdown(seconds));
            if (seconds <= 0) {
                if (i.data.turn.ownerId == Meteor.userId()) {
                    i.cardTimer.text('');
                    endTurn(i.data.game);
                }
            } else {
                countdownCard(i);
            }
        } else {
            i.cardTimer.text('');
        }
    }, 1000);
}

function cardIsGuessed(card) {
    return (card && (card.correct !== null));
}