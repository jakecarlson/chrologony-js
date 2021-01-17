import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { NonEmptyString, RecordId } from "../../startup/validations";
import { Permissions } from '../../modules/Permissions';

import { Categories } from "../Categories";

Meteor.methods({

    'user.updateProfile'(attrs) {

        check(
            attrs,
            {
                name: Match.Maybe(String),
                pageSize: Match.Maybe(Number),
                muted: Match.Maybe(Boolean),
            }
        );
        Permissions.authenticated();

        Logger.log('Update user profile: ' + JSON.stringify(attrs));

        attrs = _.defaults(attrs, Meteor.user().profile);
        return Meteor.users.update(this.userId, {$set: {profile: attrs}});

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

        // Create the user's first game
        'user.createFirstGame'() {

            const gameName = Meteor.user().name() + "'s Private Game";
            const category = Categories.findOne(Meteor.settings.categories.default);
            const attrs = {
                categoryId: category._id,
                name: gameName,
                private: true,
                comparisonPrecision: category.precision,
                displayPrecision: category.precision,
                autoShowMore: true,
            };

            return Meteor.call('game.create', attrs);

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

                this.unblock();

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
            Permissions.authenticated();
            return Meteor.users.update(this.userId, {$set: {lastActiveAt: new Date()}});
        },

    });

}