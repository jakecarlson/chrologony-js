import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { Flasher } from '../flasher';
import { LoadingState } from '../../modules/LoadingState';

import '../../api/Users';
import { Clues } from '../../api/Clues';
import { Games } from '../../api/Games';
import { Turns } from '../../api/Turns';
import { Cards } from "../../api/Cards";

import './room.html';
import './player_cards.js';
import './board.js';
import './players_list.js';
import './game.js';
import Clipboard from "clipboard";

Template.room.onCreated(function roomOnCreated() {

    this.initialized = false;
    this.room = new ReactiveVar(null);
    this.game = new ReactiveVar(null);
    this.turn = new ReactiveVar(null);
    this.clueMore = new ReactiveVar(null);

    this.autorun((computation) => {

        /*
        console.log('AUTORUN');
        computation.onInvalidate(function() {
            console.trace();
        });
         */

        LoadingState.start();
        FlowRouter.watchPathChange();

        const user = Meteor.user({fields: {currentRoomId: 1}});
        if (user) {

            const roomId = user.currentRoomId;

            // Redirect the user back to lobby if they aren't authenticated to this room
            if (roomId != FlowRouter.getParam('id')) {
                Flasher.set('danger', "You are not authorized to view that room.");
                leaveRoom();
            }

            this.room.set(user.currentRoom());
            if (this.room.get()) {

                subscribe(this, 'players', this.room.get()._id);
                subscribe(this, 'games', this.room.get()._id);

                if (this.room.get().currentGameId) {

                    subscribe(this, 'turns', this.room.get().currentGameId);
                    subscribe(this, 'cards', this.room.get().currentGameId);
                    subscribe(this, 'cardClues', this.room.get().currentGameId);
                    subscribe(this, 'votes', this.room.get().currentGameId);

                    this.game.set(Games.findOne(this.room.get().currentGameId));
                    if (this.game.get() && this.game.get().currentTurnId) {
                        this.turn.set(Turns.findOne(this.game.get().currentTurnId));
                    }

                } else {
                    this.game.set(null);
                    this.turn.set(null);
                }

                if (this.subscriptionsReady()) {

                    const self = this;
                    Tracker.afterFlush(() => {

                        let clipboards = new Clipboard('[data-clipboard-text]');
                        clipboards.on('success', function(e) {
                            let btn = $(e.trigger);
                            btn.tooltip('show');
                            setTimeout(function() {btn.tooltip('hide');},3000);
                        });

                        $('#clueMore').on('hidden.bs.modal', function(e) {
                            self.clueMore.set(null);
                        });

                    });

                    this.initialized = true;
                    LoadingState.stop();

                }

            } else {
                LoadingState.stop();
            }

        }

    });

    let self = this;
    Games.find().observeChanges({
        added: function(gameId, fields) {
            if (self.initialized) {
                self.game.set(Games.findOne(gameId));
            }
        }
    });

    Turns.find().observeChanges({
        added: function(turnId, fields) {
            if (self.initialized) {
                self.turn.set(Turns.findOne(turnId));
            }
        }
    });

    Cards.find().observeChanges({

        added: function(cardId, fields) {
            if (self.initialized && self.room.get()) {
                subscribe(Meteor, 'cards', self.room.get().currentGameId);
                subscribe(Meteor, 'cardClues', self.room.get().currentGameId);
            }
        },

        changed(cardId, fields) {
            if (self.initialized && (fields.correct != null)) {
                const card = Cards.findOne(cardId);
                Meteor.call('clue.get', card.clueId, function(err, clue) {
                    if (!err) {
                        Logger.log("Update Clue Data: " + card.clueId);
                        Clues._collection.update(card.clueId, {$set: clue});
                    }
                });
            }
        },

    });

});

Template.room.helpers({

    dataReady() {
        return (Meteor.user() && Meteor.user().currentRoomId && Template.instance().room.get());
    },

    name() {
        return Template.instance().room.get().name;
    },

    isOwner() {
        return isOwner(Template);
    },

    currentRoom() {
        return Template.instance().room.get();
    },

    currentGame() {
        return Template.instance().game.get();
    },

    currentTurn() {
        return getCurrentTurn(Template);
    },

    players() {
        return Template.instance().room.get().players();
    },

    password() {
        return Template.instance().room.get().password;
    },

    owner() {
        return Template.instance().room.get().owner();
    },

    link() {
        return Meteor.absoluteUrl(FlowRouter.path('joinByToken', {id: Template.instance().room.get()._id, token: Template.instance().room.get().token}));
    },

    moreName() {
        const clue = Template.instance().clueMore.get();
        return (clue) ? Formatter.date(clue.date) : null;
    },

    hasMore() {
        const i = Template.instance();
        const clue = i.clueMore.get();
        if (clue) {
            return (
                hasMoreAttr(i, 'moreInfo') ||
                hasMoreAttr(i, 'externalUrl') ||
                hasMoreImage(i) ||
                hasMoreLocation(i)
            );
        }
        return false;
    },

    moreAttr(attr) {
        return moreAttr(Template.instance(), attr);
    },

    hasMoreAttr(attr) {
        return hasMoreAttr(Template.instance(), attr);
    },

    hasMoreImage() {
        return hasMoreImage(Template.instance());
    },

    moreImageUrl() {
        const clue = Template.instance().clueMore.get();
        return (clue.imageUrl) ? clue.imageUrl : clue.thumbnailUrl;
    },

    moreThumbnailUrl() {
        const clue = Template.instance().clueMore.get();
        return (clue.thumbnailUrl) ? clue.thumbnailUrl : clue.imageUrl;
    },

    hasMoreLocation() {
        return hasMoreLocation(Template.instance());
    },

    moreMapUrl() {
        const i = Template.instance();
        const coords = moreAttr(i, 'latitude') + ',' + moreAttr(i, 'longitude');
        let url = 'https://www.google.com/maps/embed/v1/place?key=' + Meteor.settings.public.maps.apiKey + '&';
        url += 'zoom=' + Meteor.settings.public.maps.zoom + '&';
        url += 'maptype=' + Meteor.settings.public.maps.type + '&';
        url += 'center=' + coords + '&';
        url += 'q=' + coords;
        return url;
    },

    showPlayerCards() {
        return (
            Template.instance().game.get() &&
            (Template.instance().room.get().players().count() > 1)
        );
    },

    isNotCurrentPlayer(player) {
        const turn = getCurrentTurn(Template);
        return (!turn || (player._id != turn.ownerId));
    },

    gameInProgress() {
        return getCurrentTurn(Template);
    },

    showGameEnd() {
        return (isOwner(Template) && getCurrentTurn(Template));
    },

});

Template.room.events({

    'click .leave'(e, i) {
        leaveRoom();
    },

    'click .destroy'(e, i) {
        LoadingState.start(e);
        Meteor.call('room.remove', i.room.get()._id, function(err, id) {
            if (!err) {
                Logger.log("Room Deleted: " + id);
                Flasher.set('success', "You have successfully deleted the room. You can join or create a new one below.");
                FlowRouter.go('lobby');
            }
            LoadingState.stop();
        });
    },

    'click .end-game'(e, i) {
        LoadingState.start(e);
        Meteor.call('game.end', i.game.get()._id, false, function(err, updated) {
            if (!err) {
                Logger.log("Ended Game: " + i.game.get()._id);
            }
        });
    },

    'click .abandon-game'(e, i) {
        LoadingState.start(e);
        const gameId = i.game.get()._id;
        Meteor.call('game.end', gameId, true, function(err, updated) {
            if (!err) {
                Logger.log("Abandoned Game: " + gameId);
            }
        });
    },

    'click .more'(e, i) {
        const card = $(e.target).closest('.game-card');
        const id = card.attr('data-id');
        i.clueMore.set(Cards.findOne(id).clue());
        if (i.clueMore.get()) {
            $('#clueMore').modal('show');
        }
    },

});

function leaveRoom() {
    LoadingState.start();
    Meteor.call('room.leave', false, function(err, id) {
        if (!err) {
            Logger.log("Player Left Room: " + id);
        }
        Flasher.clear();
        FlowRouter.go('lobby');
    });
}

function subscribe(ctx, name, arg) {
    Logger.log('Subscribe: ' + name);
    ctx.subscribe(name, arg);
}

function hasMoreImage(i) {
    const clue = i.clueMore.get();
    if (clue) {
        return (clue.thumbnailUrl || clue.imageUrl);
    }
    return false;
}

function hasMoreLocation(i) {
    const clue = i.clueMore.get();
    if (clue) {
        return (clue.latitude && clue.longitude);
    }
    return false;
}

function hasMoreAttr(i, attr) {
    const clue = i.clueMore.get();
    return (clue && clue[attr]);
}

function moreAttr(i, attr) {
    const clue = i.clueMore.get();
    if (clue) {
        return clue[attr];
    } else {
        return null;
    }
}

function getCurrentTurn(t) {
    return t.instance().turn.get();
}

function isOwner(t) {
    return (t.instance().room.get().ownerId == Meteor.userId())
}