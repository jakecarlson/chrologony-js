import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { Session } from 'meteor/session';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { AccountsTemplates } from 'meteor/useraccounts:core';
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
    redirect: function() {
        if (Meteor.user()) {
            redirectToPrevious('lobby');
        }
    },
});

AccountsTemplates.configureRoute('signUp', {
    name: 'signUp',
    path: '/sign-up',
    redirect: function() {
        if (Meteor.user()) {
            const username = Meteor.user().username;
            if (username) {
                Meteor.users.update(Meteor.userId(), {$set: {'profile.name': username}});
            }
            Flasher.set('success', 'You have successfully registered. Create or join a room and give it a try! Or <a href="#tour" class="tour-link">take the full tour now.</a>');
            redirectToPrevious('lobby');
        }
    },
});

AccountsTemplates.configureRoute('changePwd', {
    name: 'changePassword',
    path: '/change-password',
    layoutTemplate: 'layout_authenticated',
    redirect: function() {
        if (Meteor.user()) {
            Flasher.set('success', 'You have successfully changed your password.');
            FlowRouter.go('lobby');
        }
    },
});

AccountsTemplates.configureRoute('forgotPwd', {
    name: 'forgotPassword',
    path: '/forgot-password',
    redirect: function() {
        if (Meteor.user()) {
            FlowRouter.go('home');
        }
    },
});

AccountsTemplates.configureRoute('resetPwd', {
    name: 'resetPassword',
    path: '/reset-password',
    redirect: function() {
        if (Meteor.user()) {
            FlowRouter.go('home');
        }
    },
});

FlowRouter.route('/privacy', {
    name: 'privacy',
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
    action(params, queryParams) {
        Logger.log("Route: logout");
        AccountsTemplates.logout();
        FlowRouter.go('home');
    }
});

FlowRouter.route('/lobby', {
    name: 'lobby',
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
    triggersEnter: [redirectToHome],
    action(params, queryParams) {
        Logger.log("Route: clues");
        BlazeLayout.render(
            'layout_authenticated',
            {
                main: 'lobby',
            }
        );
    }
});

FlowRouter.route('/clues/:categoryId', {
    name: 'clues.categoryId',
    triggersEnter: [redirectToHome],
    action(params, queryParams) {
        Logger.log("Route: clues.categoryId");
        BlazeLayout.render(
            'layout_authenticated',
            {
                main: 'lobby',
            }
        );
    }
});

FlowRouter.route('/categories', {
    name: 'categories',
    triggersEnter: [redirectToHome],
    action(params, queryParams) {
        Logger.log("Route: categories");
        BlazeLayout.render(
            'layout_authenticated',
            {
                main: 'lobby',
            }
        );
    }
});

FlowRouter.route('/rooms/:id', {
    name: 'room',
    triggersEnter: [redirectToHome],
    action(params, queryParams) {
        Logger.log("Route: room");
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
                FlowRouter.go('room', {id: id});
            }
        });
    }
});

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