import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from "meteor/session";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import Sortable from 'sortablejs';
import { LoadingState } from '../../modules/LoadingState';

// import { Insult } from "insult";

import { Turns } from '../../api/Turns';

import './board.html';
import './card.js';
import '../confirm_modal.js';

Template.board.onCreated(function boardOnCreated() {

    // For some reason the turn isn't always defined properly; fix it now
    // if (!this.data.turn && this.data.game.currentTurnId) {
    //     this.data.turn = Turns.findOne(this.data.game.currentTurnId);
    // }

    // Make sure the current turn isn't for a user who isn't in the game anymore
    if (
        this.data.turn &&
        (this.data.turn.ownerId != Meteor.userId()) &&
        !this.data.game.hasPlayer(this.data.turn.ownerId)
    ) {
        endTurn(this.data);
    }

    this.autorun(() => {

        if (this.subscriptionsReady()) {
            // const data = Template.currentData();
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

    let ctx = this;
    $('html').off('keyup').keyup(function(e) {
        Logger.log('Key Press: ' + e.keyCode);
        handleKeyPress(e, Blaze.getData(ctx.view));
    });

});

Template.board.onDestroyed(() => {
    $('html').off('keyup');
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
        return !canSubmitGuess(this);
    },

    cannotDrawCard() {
        return !canDrawCard(this);
    },

    cannotEndTurn() {
        return !canEndTurn(this);
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
        submitGuess(this, e);
    },

    'click .draw-card'(e, i) {
        drawCard(this, e);
    },

    // If this the game owner ending the turn early, prompt before going through with it
    'click .end-turn'(e, i) {
        if (['waiting', 'guessing'].includes(getStatus(this.turn))) {
            $('#turnEndModal').modal('show');
        } else {
            endTurn(this, e);
        }
    },

    'click #turnEndModal .confirm'(e, i) {
        $('#turnEndModal').modal('hide');
        endTurn(Template.currentData(), e);
    },

    'click .move-back'(e, i) {
        moveBack(e, i);
    },

    'click .move-forward'(e, i) {
        moveForward(e, i);
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

function drawCard(data) {

    if (canDrawCard(data)) {

        LoadingState.start();

        Meteor.call('card.draw', data.game.currentTurnId, function(err, id) {
            if (!err) {
                Logger.log("Created Card: " + id);
                SoundManager.play('cardDraw');
            } else {
                throw new Meteor.Error('card-not-drawn', 'Could not draw a card.', err);
            }
            saveCardPos();
            LoadingState.stop();
        });

        Helpers.updateLastActivity();

    }

}

function endTurn(data, e = false) {

    if (canEndTurn(data)) {

        if (e) {
            LoadingState.start(e);
        }

        SoundManager.play('turnEnd');

        Session.set('waiting', true);
        Logger.log('End Turn: ' + data.game.currentTurnId);

        Meteor.call('turn.next', data.game._id, function(err, id) {

            if (!err) {
                Logger.log("Start Turn: " + id);
            } else {
                throw new Meteor.Error('turn-not-set', 'Could not set a turn.', err);
            }
            Session.set('waiting', false);
            LoadingState.stop();
            TourGuide.resume();

        });

        Helpers.updateLastActivity();

    }

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

function gameHasStarted(game) {
    return (game && game.startedAt);
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
                    endTurn(i.data);
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

function moveBack(e) {
    e.preventDefault();
    const currentCol = getCurrentClueCol();
    if (currentCol) {
        const destinationCol = currentCol.prev();
        if (destinationCol.length > 0) {
            currentCol.insertBefore(destinationCol);
            saveCardPos();
        }
    }
}

function moveForward(e) {
    e.preventDefault();
    const currentCol = getCurrentClueCol();
    if (currentCol) {
        const destinationCol = currentCol.next();
        if (destinationCol.length > 0) {
            currentCol.insertAfter(destinationCol);
            saveCardPos();
        }
    }
}

function getCurrentClueCol() {
    return $('.board-card.owned.current').closest('.clue-col');
}

function handleKeyPress(e, data) {
    if (data.turn && (data.turn.ownerId == Meteor.userId())) {
        switch(e.keyCode) {

            // Move card back
            case 37: // left
            case 38: // up
            case 66: // b
                moveBack(e);
                break;

            // Move card forward
            case 39: // right
            case 40: // down
            case 70: // f
                moveForward(e);
                break;

            // Submit card
            case 83: // s
                submitGuess(data, e);
                break;

            // Draw card
            case 68: // d
                drawCard(data, e);
                break;

            // End turn
            case 69: // e
                endTurn(data, e);
                break;

        }
    }
}

function submitGuess(data, e) {

    if (canSubmitGuess(data)) {

        LoadingState.start(e);
        Session.set('waiting', true);

        if (!data.turn) { // Cannot figure out why this is sometimes not defined; fix it now
            data.turn = Turns.findOne(data.game.currentTurnId);
        }

        let currentCardPos = null;
        const currentCardId = data.turn.currentCardId;

        $('.board-card').each(function(n, card) {
            const id = $(card).attr('data-id');
            if (id === currentCardId) {
                currentCardPos = n;
            }
        });

        Meteor.call('card.submitGuess', currentCardId, currentCardPos, function(err, correct) {
            if (!err) {

                Logger.log('Guess Correct for ' + currentCardId + ': ' + correct);

                if (correct) {
                    SoundManager.play('cardRight');
                } else {
                    SoundManager.play('cardWrong');
                }

                if (correct && data.game.autoProceed) {
                    if (data.turn.hasReachedCardLimit()) {
                        endTurn(data);
                    } else {
                        drawCard(data);
                    }
                }

            } else {
                throw new Meteor.Error('card-not-submitted', 'Could not submit a guess for the card.', err);
            }

            TourGuide.resume();

        });

        Helpers.updateLastActivity();

    }

}

function canSubmitGuess(data) {
    return !(
        LoadingState.active() ||
        !isCurrentPlayer(data.turn) ||
        gameHasEnded(data.game) ||
        ['waiting', 'correct', 'incorrect', 'empty'].includes(getStatus(data.turn))
    );
}

function canDrawCard(data) {
    return !(
        LoadingState.active() ||
        !data.turn ||
        !isCurrentPlayer(data.turn) ||
        gameHasEnded(data.game) ||
        ['waiting', 'guessing', 'incorrect', 'empty'].includes(getStatus(data.turn)) ||
        data.turn.hasReachedCardLimit()
    );
}

function canEndTurn(data) {
    return !(
        gameHasEnded(data.game) ||
        !gameHasStarted(data.game) ||
        (
            (
                !isGameOwner(data.game) ||
                Helpers.isAnonymous() ||
                TourGuide.isActive()
            ) &&
            (
                LoadingState.active() ||
                !isCurrentPlayer(data.turn) ||
                ['waiting', 'guessing'].includes(getStatus(data.turn))
            )
        )
    );
}