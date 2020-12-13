import { Session } from "meteor/session";
import { LoadingState } from "./LoadingState";

Flasher = {

    type() {
        return (Session.get('flasher')) ? Session.get('flasher').type : false;
    },

    msg() {
        return (Session.get('flasher')) ? Session.get('flasher').msg : false;
    },

    set(type, msg, hideDelay = 5) {
        Logger.log('Flasher [' + type + ']: ' + msg);
        Session.set('flasher', {type: type, msg: msg});
        if (hideDelay) {
            setTimeout(this.clear, hideDelay * 1000);
        }
        if (type == 'danger') {
            LoadingState.stop();
        }
    },

    success(msg, hideDelay = 5) { return this.set('success', msg, hideDelay); },
    info(msg, hideDelay = 5) { return this.set('warning', msg, hideDelay); },
    error(msg, hideDelay = 5) { return this.set('danger', msg, hideDelay); },

    clear() {
        Logger.log('Flasher: clear');
        Session.set('flasher', false);
    },

};