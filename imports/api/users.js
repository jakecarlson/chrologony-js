import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import {NonEmptyString} from "../startup/validations";

if (Meteor.isServer) {

    // Additional user data
    Meteor.publish('userData', function () {
        if (this.userId) {
            return Meteor.users.find({ _id: this.userId }, {
                fields: { currentRoomId: 1}
            });
        } else {
            this.ready();
        }
    });

    // Get the players in the room
    Meteor.publish('players', function playersPublication(roomId) {
        if (this.userId) {
            return Meteor.users.find({currentRoomId: roomId});
        } else {
            return this.ready();
        }
    });

}

Meteor.methods({

    // Update
    'user.update'(attrs) {

        check(attrs._id, NonEmptyString);
        check(attrs.currentRoomId, NonEmptyString);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        console.log('Update User: ' + attrs._id);
        console.log(attrs);

        // If there is an ID, this is an update
        return Meteor.users.update(
            {
                _id: attrs._id,
            },
            {
                $set: {
                    currentRoomId: attrs.currentRoomId,
                    updatedAt: new Date(),
                }
            }
        );

    },

});

if (Meteor.isServer) {

    Meteor.methods({

        // Validate CAPTCHA
        'user.validateCaptcha'(captcha) {
            let captchaResult = reCAPTCHA.verifyCaptcha(this.connection.clientAddress, captcha);
            if (!captchaResult.success) {
                console.log('reCAPTCHA check failed!', captchaResult);
                throw new Meteor.Error(422, 'reCAPTCHA Failed: ' + captchaResult.error);
            }
            return captchaResult;
        },

    });

}