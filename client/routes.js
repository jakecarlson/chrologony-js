import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
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
            FlowRouter.go('lobby');
        }
    },
});

AccountsTemplates.configureRoute('signUp', {
    name: 'signUp',
    path: '/sign-up',
    redirect: function() {
        if (Meteor.user()) {
            Flasher.set('success', 'You have successfully registered. Create or join a room and give it a try!');
            FlowRouter.go('lobby');
        }
    },
});

AccountsTemplates.configureRoute('changePwd', {
    name: 'changePassword',
    path: '/change-password',
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
        Logger.log("Route: clues.category");
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
                Flasher.set('success', "Success! Invite others to join.");
                FlowRouter.go('room', {id: id});
            }
        });
    }
});

function redirectToHome(ctx, redirect) {
    if (!Meteor.userId()) {
        redirect(FlowRouter.path(
            'signIn',
            {},
            {redirect: FlowRouter.current().path}
        ));
    }
}

function redirectToLobby(ctx, redirect) {
    if (Meteor.userId()) {
        redirect('lobby');
    }
}