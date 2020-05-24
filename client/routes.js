import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import {Flasher} from "../imports/ui/flasher";

FlowRouter.route('/', {
    name: 'home',
    triggersEnter: [redirectToLobby],
    action(params, queryParams) {
        Logger.log("Route: home");
        BlazeLayout.render(
            'layout_unauthenticated',
            {
                main: 'login',
            }
        );
    }
});

FlowRouter.route('/register', {
    name: 'register',
    triggersEnter: [redirectToLobby],
    action(params, queryParams) {
        Logger.log("Route: register");
        BlazeLayout.render(
            'layout_unauthenticated',
            {
                main: 'register',
            }
        );
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

// Tracker.autorun(redirectToHome);

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