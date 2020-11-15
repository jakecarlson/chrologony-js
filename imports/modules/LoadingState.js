import { Session } from 'meteor/session';

export const LoadingState = {

    start(e) {
        if (e) {
            e.preventDefault();
        }
        if (!this.started) {
            this.started = performance.now();
        }
        Session.set('loading', true);
    },

    stop() {
        if (!Session.get('waiting')) {
            Session.set('loading', false);
            const started = this.started;
            this.started = null;
            return (performance.now() - started);
        }
    },

    active() {
        return (Session.get('loading') || Session.get('waiting'));
    },

};