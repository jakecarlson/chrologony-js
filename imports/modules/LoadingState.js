import { Session } from 'meteor/session';

export const LoadingState = {

    start(e) {
        if (e) {
            e.preventDefault();
        }
        Session.set('loading', true);
    },

    stop() {
        Session.set('loading', false);
    },

    active() {
        return Session.get('loading');
    },

};