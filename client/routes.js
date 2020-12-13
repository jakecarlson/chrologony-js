import { Meteor } from "meteor/meteor";
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { FlowRouterMeta, FlowRouterTitle } from 'meteor/ostrio:flow-router-meta';
import { Session } from 'meteor/session';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { AccountsTemplates } from 'meteor/useraccounts:core';
import { Categories } from '../imports/api/Categories';
import { Games } from '../imports/api/Games';

document.addEventListener('deviceready', function() {
    universalLinks.subscribe('ulink', function(e) {
        Logger.log('Universal Link: ' + JSON.stringify(e));
        FlowRouter.go(e.path, {}, e.params);
    });
}, false);

AccountsTemplates.configure({
    defaultTemplate: 'atForm',
    defaultLayout: 'layout_unauthenticated',
    defaultLayoutRegions: {},
    defaultContentRegion: 'main'
});

AccountsTemplates.configureRoute('signIn', {
    name: 'home',
    path: '/',
    title: getTitle(Meteor.settings.public.app.tagline),
    redirect: function() {
        if (Meteor.user()) {
            Logger.audit('login', {guest: false});
            Logger.track('login', {guest: false});
            Helpers.redirectToPrevious('lobby');
        }
    },
});

AccountsTemplates.configureRoute('signUp', {
    name: 'signUp',
    path: '/sign-up',
    title: getTitle('Sign Up'),
    redirect: function() {
        if (Meteor.user()) {
            Flasher.success(
                'You have successfully registered. Create or join a game and give it a try! ' +
                'Or <a href="#tour" class="tour-link">take the full tour now.</a>'
            );
            Logger.audit('signUp');
            Logger.track('signUp');
            Helpers.redirectToPrevious('lobby');
        }
    },
});

AccountsTemplates.configureRoute('changePwd', {
    name: 'changePassword',
    path: '/change-password',
    title: getTitle('Change Your Password'),
    layoutTemplate: 'layout_authenticated',
    redirect: function() {
        if (Meteor.user()) {
            Flasher.success('You have successfully changed your password.');
            Logger.audit('changePassword');
            Logger.track('changePassword');
            FlowRouter.go('lobby');
        }
    },
});

AccountsTemplates.configureRoute('forgotPwd', {
    name: 'forgotPassword',
    path: '/forgot-password',
    title: getTitle('Forgot Your Password?'),
    redirect: function() {
        if (Meteor.user()) {
            FlowRouter.go('home');
        }
    },
});

AccountsTemplates.configureRoute('verifyEmail', {
    name: 'verifyEmail',
    path: '/verify-email',
    title: getTitle('Verify Your Email Address'),
    redirect: function() {
        if (Meteor.user()) {
            Flasher.success('You have successfully verified your email address.');
            Logger.audit('verifyEmail');
            Logger.track('verifyEmail');
            FlowRouter.go('lobby');
        }
    },
});

AccountsTemplates.configureRoute('resendVerificationEmail', {
    name: 'resendVerificationEmail',
    path: '/send-again',
    title: getTitle('Send Email Verification Email Again'),
    redirect: function() {
        if (Meteor.user()) {
            FlowRouter.go('home');
        }
    },
});

AccountsTemplates.configureRoute('resetPwd', {
    name: 'resetPassword',
    path: '/reset-password',
    title: getTitle('Reset Your Password'),
    redirect: function() {
        if (Meteor.user()) {
            Flasher.success('You have successfully reset your password.');
            FlowRouter.go('lobby');
        }
    },
});

FlowRouter.route('/privacy', {
    name: 'privacy',
    title: getTitle('Privacy Policy'),
    action(params, queryParams) {
        Logger.log("Route: privacy");
        BlazeLayout.render(
            'layout_authenticated',
            {
                main: 'privacy',
            }
        );
    }
});

FlowRouter.route('/terms', {
    name: 'terms',
    title: getTitle('Terms of Use'),
    action(params, queryParams) {
        Logger.log("Route: terms");
        BlazeLayout.render(
            'layout_authenticated',
            {
                main: 'terms',
            }
        );
    }
});

FlowRouter.route('/lobby', {
    name: 'lobby',
    title: getTitle('Lobby'),
    triggersEnter: [redirectToHome, Helpers.updateLastActivity],
    action(params, queryParams) {
        Logger.log("Route: lobby");
        BlazeLayout.render(
            'layout_authenticated',
            {
                main: 'lobby',
            }
        );
    },
});

FlowRouter.route('/clues', {
    name: 'clues',
    title: getTitle('Manage Clues'),
    triggersEnter: [redirectToHome, Helpers.updateLastActivity],
    action(params, queryParams) {
        Logger.log("Route: clues");
        BlazeLayout.render(
            'layout_authenticated',
            {
                main: 'clues_manager',
            }
        );
    }
});

FlowRouter.route('/clues/:categoryId', {
    name: 'clues.categoryId',
    title(params, query, data) {
        const category = Categories.findOne(params.categoryId);
        return getTitle('Manage Clues: ' + (category ? category.name : 'unknown'));
    },
    triggersEnter: [redirectToHome, Helpers.updateLastActivity],
    action(params, queryParams) {
        Logger.log("Route: clues.categoryId");
        Logger.track('manageClues', {categoryId: params.categoryId});
        BlazeLayout.render(
            'layout_authenticated',
            {
                main: 'clues_manager',
            }
        );
    }
});

FlowRouter.route('/clues/:categoryId/:clueId', {
    name: 'clues.categoryId.clueId',
    title(params, query, data) {
        const category = Categories.findOne(params.categoryId);
        return getTitle('Manage Clues: ' + (category ? category.name : 'unknown'));
    },
    triggersEnter: [redirectToHome, Helpers.updateLastActivity],
    action(params, queryParams) {
        Logger.log("Route: clues.categoryId.clueId");
        Logger.track('manageClues', {categoryId: params.categoryId, clueId: params.clueId});
        BlazeLayout.render(
            'layout_authenticated',
            {
                main: 'clues_manager',
            }
        );
    }
});

FlowRouter.route('/categories', {
    name: 'categories',
    title: getTitle('Manage Categories'),
    triggersEnter: [redirectToHome, Helpers.updateLastActivity],
    action(params, queryParams) {
        Logger.log("Route: categories");
        BlazeLayout.render(
            'layout_authenticated',
            {
                main: 'categories_manager',
            }
        );
    }
});

FlowRouter.route('/games/:id/:token?', {

    name: 'game',

    title(params, query, data) {
        const game = Games.findOne(params.id);
        return getTitle(game ? game.title() : 'unknown');
    },

    triggersEnter: [redirectToHome, Helpers.updateLastActivity],

    action(params, queryParams) {

        Logger.log("Route: game");

        if (params.token) {
            Meteor.call('game.joinByToken', params.id, params.token, function(err, id) {
                if (err) {
                    Logger.log(err);
                    Flasher.error('Game token is not valid.');
                    FlowRouter.go('lobby');
                } else {
                    Logger.log("Game Set: " + id);
                    Meteor.subscribe('games', Helpers.currentAndPreviousGameIds());
                    Flasher.success(
                        "Success! Invite others to join using any of the options under the 'Invite' button.",
                        10
                    );
                    renderGame(params);
                }
            });
        } else {
            renderGame(params);
        }

    }

});

FlowRouter.route('/embed', {
    name: 'embed',
    title: getTitle(Meteor.settings.public.app.tagline),
    action(params, queryParams) {
        Logger.log("Route: embed");
        BlazeLayout.render('embed');
    }
});

new FlowRouterMeta(FlowRouter);
new FlowRouterTitle(FlowRouter);

function redirectToHome(ctx, redirect) {
    if (!Meteor.userId()) {
        Session.set('redirect', FlowRouter.current().path);
        redirect(FlowRouter.path('home'), {}, {redirect: FlowRouter.current().path});
    }
}

function getTitle(page) {
    return Meteor.settings.public.app.name + ': ' + page;
}

function renderGame(params) {
    Logger.audit('join', {collection: 'Games', documentId: params.id});
    Logger.track('joinGame', {gameId: params.id, token: params.token});
    BlazeLayout.render(
        'layout_authenticated',
        {
            main: 'game',
        }
    );
}