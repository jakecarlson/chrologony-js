import { Meteor } from "meteor/meteor";
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { FlowRouterMeta, FlowRouterTitle } from 'meteor/ostrio:flow-router-meta';
import { Session } from 'meteor/session';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { AccountsTemplates } from 'meteor/useraccounts:core';
import { Categories } from '../imports/api/Categories';
import { Rooms } from '../imports/api/Rooms';
import { Flasher } from "../imports/ui/flasher";

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
            Logger.audit('login');
            Logger.track('login');
            redirectToPrevious('lobby');
        }
    },
});

AccountsTemplates.configureRoute('signUp', {
    name: 'signUp',
    path: '/sign-up',
    title: getTitle('Sign Up'),
    redirect: function() {
        if (Meteor.user()) {
            const username = Meteor.user().username;
            if (username) {
                Meteor.users.update(Meteor.userId(), {$set: {'profile.name': username}});
            }
            Meteor.call('user.sendWelcome');
            Flasher.set('success', 'You have successfully registered. Create or join a room and give it a try! Or <a href="#tour" class="tour-link">take the full tour now.</a>');
            Logger.audit('signUp');
            Logger.track('signUp');
            redirectToPrevious('lobby');
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
            Flasher.set('success', 'You have successfully changed your password.');
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
            Flasher.set('success', 'You have successfully verified your email address.');
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
            Flasher.set('success', 'You have successfully reset your password.');
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

FlowRouter.route('/logout', {
    name: 'logout',
    title: getTitle('Logout'),
    action(params, queryParams) {
        Logger.log("Route: logout");
        Logger.audit('logout');
        Logger.track('logout');
        AccountsTemplates.logout();
        FlowRouter.go('home');
    }
});

FlowRouter.route('/lobby', {
    name: 'lobby',
    title: getTitle('Lobby'),
    triggersEnter: [redirectToHome],
    action(params, queryParams) {
        Logger.log("Route: lobby");
        BlazeLayout.render(
            'layout_authenticated',
            {
                main: 'lobby',
            }
        );
    }
});

FlowRouter.route('/clues', {
    name: 'clues',
    title: getTitle('Manage Clues'),
    triggersEnter: [redirectToHome],
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
    triggersEnter: [redirectToHome],
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
    triggersEnter: [redirectToHome],
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
    triggersEnter: [redirectToHome],
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

FlowRouter.route('/rooms/:id', {
    name: 'room',
    title(params, query, data) {
        const room = Rooms.findOne(params.id);
        return getTitle(room ? room.name : 'unknown');
    },
    triggersEnter: [redirectToHome],
    action(params, queryParams) {
        Logger.log("Route: room");
        Logger.audit('join', {collection: 'Rooms', documentId: params.id});
        Logger.track('joinRoom', {roomId: params.id});
        BlazeLayout.render(
            'layout_authenticated',
            {
                main: 'room',
            }
        );
    }
});

FlowRouter.route('/join/:id/:token', {
    name: 'joinByToken',
    title: getTitle('Join Room by Token'),
    triggersEnter: [redirectToHome],
    action(params, queryParams) {
        Logger.log("Route: joinByToken");
        Meteor.call('room.joinByToken', params.id, params.token, function(err, id) {
            if (err) {
                Logger.log(err);
                Flasher.set('danger', "Room token is not valid.");
                FlowRouter.go('lobby');
            } else {
                Logger.log("Room Set: " + id);
                Meteor.subscribe('rooms');
                Flasher.set('success', "Success! Invite others to join.");
                Logger.audit('joinByToken', {collection: 'Rooms', documentId: params.id});
                Logger.track('joinRoomByToken', {roomId: params.id});
                FlowRouter.go('room', {id: id});
            }
        });
    }
});

new FlowRouterMeta(FlowRouter);
new FlowRouterTitle(FlowRouter);

function redirectToHome(ctx, redirect) {
    if (!Meteor.userId()) {
        Session.set('redirect', FlowRouter.current().path);
        redirect(FlowRouter.path('home'));
    }
}

function redirectToPrevious(defaultRoute = 'lobby') {
    const redirect = Session.get('redirect');
    if (redirect) {
        delete Session.keys['redirect'];
        FlowRouter.go(redirect);
    }
    FlowRouter.go(defaultRoute);
}

function getTitle(page) {
    return Meteor.settings.public.app.name + ': ' + page;
}