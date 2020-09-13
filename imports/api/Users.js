import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';
import { SSR, Template } from 'meteor/meteorhacks:ssr';

import { Rooms } from "./Rooms";
import {Accounts} from "meteor/accounts-base";

if (Meteor.isServer) {

    // Additional user data
    Meteor.publish('userData', function () {
        if (this.userId) {
            return Meteor.users.find(
                {
                    _id: this.userId,
                },
                {
                    fields: {
                        currentRoomId: 1,
                        joinedRoomAt: 1,
                    }
                }
            );
        } else {
            this.ready();
        }
    });

    // Get the players in the room
    Meteor.publish('players', function playersPublication(roomId) {
        if (this.userId && roomId) {
            return Meteor.users.find(
                {
                    currentRoomId: roomId,
                },
                {
                    fields: {
                        _id: 1,
                        'profile.name': 1,
                        currentRoomId: 1,
                        joinedRoomAt: 1,
                    }
                }
            );
        } else {
            return this.ready();
        }
    });

}

Meteor.users.helpers({

    currentRoom() {
        return Rooms.findOne({_id: this.currentRoomId, deletedAt: null});
    },

    email() {
        if (this.emails && (this.emails.length > 0)) {
            return this.emails[0].address;
        } else if (this.services) {
            console.log(this.services);
            for (const [service, data] of Object.entries(this.services)) {
                if (data.email) {
                    return data.email;
                }
            }
        }
        return false;
    },

});

if (Meteor.isServer) {

    Meteor.methods({

        'user.exists'(username) {
            return !!Meteor.users.findOne({username: username});
        },

        // Search
        'user.search'(query, excludeIds = []) {

            if (typeof(excludeIds) != 'object') {
                excludeIds = [excludeIds];
            }

            check(query, NonEmptyString);
            check(excludeIds, [RecordId]);
            Permissions.check(Permissions.authenticated());

            const regex = new RegExp(query, 'i');
            return Meteor.users.find(
                {
                    _id: {$nin: excludeIds},
                    // $text: {$search: query},
                    'profile.name': {$regex: regex},
                },
                {
                    sort: {
                        'profile.name': 1,
                    },
                }
            ).fetch();

        },

        // Get
        'user.get'(ids) {

            if (typeof(ids) != 'object') {
                ids = [ids];
            }

            check(ids, [RecordId]);
            Permissions.check(Permissions.authenticated());

            return Meteor.users.find(
                {
                        _id: {$in: ids},
                    },
                {
                    sort: {
                        'profile.name': 1,
                    },
                }
            ).fetch();

        },

        // Send welcome email
        'user.sendWelcome'() {

            const userEmail = Meteor.user().email();
            if (userEmail) {

                const email = Helpers.renderHtmlEmail({
                    subject: Meteor.settings.public.app.welcome.subject,
                    preview: Meteor.settings.public.app.welcome.preview,
                    template: 'account_welcome',
                    data: {
                        user: Meteor.user(),
                        appUrl: Meteor.absoluteUrl(),
                        tourUrl: Meteor.absoluteUrl('lobby#tour'),
                        feedbackEmail: Meteor.settings.public.app.feedbackEmail,
                    },
                });

                Email.send({
                    from: Meteor.settings.public.app.sendEmail,
                    to: userEmail,
                    subject: Meteor.settings.public.app.welcome.subject,
                    text: email.text,
                    html: email.html,
                });

            }

        },

    });

}