import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';

import { Games } from "./Games";

Meteor.users.ONLINE_THRESHOLD = 15 * 60 * 1000; // Set to 15m

Meteor.users.SELECT_FIELDS = {
    _id: 1,
    'profile.name': 1,
    currentGameId: 1,
    joinedGameAt: 1,
    lastLoggedInAt: 1,
    lastActiveAt: 1,
    guest: 1,
};

if (Meteor.isServer) {

    // Additional user data
    Meteor.publish('userData', function () {
        if (this.userId) {
            return Meteor.users.find(
                {
                    _id: this.userId,
                },
                {
                    fields: Meteor.users.SELECT_FIELDS,
                }
            );
        } else {
            this.ready();
        }
    });

    // Get the players in the room
    Meteor.publish('players', function playersPublication(userIds) {
        if (this.userId && userIds) {
            return Meteor.users.find(
                {
                    _id: {$in: userIds},
                },
                {
                    fields: Meteor.users.SELECT_FIELDS,
                }
            );
        } else {
            return this.ready();
        }
    });


}

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

if (Meteor.isServer) {

    Meteor.methods({

        'user.setGame'(id, userId = null) {

            if (!userId) {
                userId = this.userId;
            }

            const updated = Meteor.users.update(
                userId,
                {
                    $set: {
                        currentGameId: id,
                        joinedGameAt: (id) ? new Date() : null,
                    }
                }
            );
            if (!updated) {
                throw new Meteor.Error('user-not-updated', 'Could not set current game for user.');
            }

            return id;

        },

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
            Permissions.authenticated();
            Permissions.notGuest();

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
            Permissions.authenticated();
            Permissions.notGuest();

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
        'user.sendWelcome'(userId) {

            check(userId, RecordId);

            const user = Meteor.users.findOne(userId);
            const userEmail = user.email();
            if (userEmail) {

                const email = Helpers.renderHtmlEmail({
                    subject: Meteor.settings.public.app.welcome.subject,
                    preview: Meteor.settings.public.app.welcome.preview,
                    template: 'account_welcome',
                    data: {
                        user: user,
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

        'user.guest'(username, captchaResponse) {

            check(username, String);

            const apiResponse = HTTP.post("https://www.google.com/recaptcha/api/siteverify", {
                params: {
                    secret: Meteor.settings.reCaptcha.secretKey,
                    response: captchaResponse,
                    remoteip: this.connection.clientAddress,
                }
            }).data

            if (!apiResponse.success) {
                throw new Meteor.Error(422, 'reCAPTCHA Failed: ' + apiResponse.error);
            }

            // Append random 4 characters
            username += ' [' + Helpers.randomStr(4) + ']';

            try {

                const userId = Accounts.createUser({username: username});
                const updated = Meteor.users.update(userId, {$set: {guest: true}});
                if (!updated) {
                    throw new Meteor.Error('user-not-updated', 'Could not update user to guest.');
                }

                const token = Accounts._generateStampedLoginToken();
                Accounts._insertLoginToken(userId, token);
                Accounts._setLoginToken(
                    userId,
                    this.connection,
                    Accounts._hashLoginToken(token.token)
                );
                this.setUserId(userId);

                return {
                    id: userId,
                    token: token.token,
                    tokenExpires: Accounts._tokenExpiration(token.when)
                };

            } catch (err) {
                throw new Meteor.Error(err.error, err.message, err);
            }

        },

        'user.anonymous'() {
            return this.setUserId('anonymous');
        },

        'user.activity'() {
            return Meteor.users.update(this.userId, {$set: {lastActiveAt: new Date()}});
        },

    });

}