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

// AccountsTemplates.configureRoute('changePwd');


AccountsTemplates.configureRoute('changePwd', {
    name: 'changePwd',
    // template: '',
    layoutTemplate: 'layout_authenticated',
    contentRegion: 'main',
    redirect: '/lobby',
});
AccountsTemplates.configureRoute('enrollAccount');
AccountsTemplates.configureRoute('forgotPwd');
AccountsTemplates.configureRoute('resetPwd');
AccountsTemplates.configureRoute('verifyEmail');
AccountsTemplates.configureRoute('resendVerificationEmail');
AccountsTemplates.configureRoute('signIn', {
    path: '/',
    name: 'home',
    redirect: function() {
        if (Meteor.user()) {
            FlowRouter.go('lobby');
        }
    }
});
AccountsTemplates.configureRoute('signUp', {
    redirect: function() {
        if (Meteor.user()) {
            FlowRouter.go('lobby');
        }
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
            'home',
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