import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';

import { Rooms } from "./Rooms";

if (Meteor.isServer) {

    // Additional user data
    Meteor.publish('userData', function () {
        if (this.userId) {
            return Meteor.users.find({ _id: this.userId }, {
                fields: {currentRoomId: 1}
            });
        } else {
            this.ready();
        }
    });

    // Get the players in the room
    Meteor.publish('players', function playersPublication(roomId) {
        if (this.userId && roomId) {
            return Meteor.users.find({currentRoomId: roomId});
        } else {
            return this.ready();
        }
    });

}

Meteor.users.helpers({

    currentRoom() {
        console.log('user.currentRoom');
        return Rooms.findOne({_id: this.currentRoomId, deletedAt: null});
    },

});

if (Meteor.isServer) {

    Meteor.methods({

        // Validate CAPTCHA
        'user.validateCaptcha'(captcha) {
            const captchaResult = reCAPTCHA.verifyCaptcha(this.connection.clientAddress, captcha);
            if (!captchaResult.success) {
                Logger.log('reCAPTCHA check failed!', captchaResult);
                throw new Meteor.Error(422, 'reCAPTCHA Failed: ' + captchaResult.error);
            }
            return captchaResult;
        },

        // Search
        'user.search'(query, excludeIds = []) {

            if (typeof(excludeIds) != 'object') {
                excludeIds = [excludeIds];
            }

            check(query, NonEmptyString);
            check(excludeIds, [RecordId]);
            Permissions.authenticated();

            const regex = new RegExp("^" + query, 'i');
            return Meteor.users.find(
                {
                    username: {$regex: regex},
                    _id: {$nin: excludeIds},
                },
                {
                    sort: {username: 1},
                }
            ).fetch();

        },

        // Get
        'user.get'(ids) {

            if (typeof(ids) != 'object') {
                ids = [ids];
            }

            check(ids, [RecordId]);
            Permissions.authenticated();

            return Meteor.users.find(
                {
                        _id: {$in: ids},
                    },
                {
                    sort: {username: 1},
                }
            ).fetch();

        },

    });

}