import { Meteor } from 'meteor/meteor';

import { Games } from "../Games";

Meteor.users.helpers({

    currentGame() {
        return Games.findOne({_id: this.currentGameId, deletedAt: null});
    },

    email() {
        if (this.emails && (this.emails.length > 0)) {
            return this.emails[0].address;
        } else if (this.services) {
            for (const [service, data] of Object.entries(this.services)) {
                if (data.email) {
                    return data.email;
                }
            }
        }
        return false;
    },

    name() {
        if (this.profile && this.profile.name) {
            return this.profile.name;
        }
        return null;
    },

    canChangePassword() {
        return (!this.guest && this.username);
    },

    isInGame(gameId) {
        return (this.currentGameId == gameId);
    },

    isOnline() {
        if (this.lastActiveAt) {
            const timeSinceLastActivity = (new Date().getTime() - this.lastActiveAt.getTime());
            return (timeSinceLastActivity < Meteor.users.ONLINE_THRESHOLD);
        }
        return false;
    },

});