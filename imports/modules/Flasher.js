import { Session } from "meteor/session";
import { LoadingState } from "./LoadingState";

Flasher = {

    type() {
        return (Session.get('flasher')) ? Session.get('flasher').type : false;
    },

    msg() {
        return (Session.get('flasher')) ? Session.get('flasher').msg : false;
    },

    set(type, msg, hideDelay = 5000) {
        Logger.log('Flasher [' + type + ']: ' + msg);
        Session.set('flasher', {type: type, msg: msg});
        if (hideDelay) {
            setTimeout(this.clear, hideDelay);
        }
        if (type == 'danger') {
            LoadingState.stop();
        }
    },

    clear() {
        Session.set('flasher', false);
    },

};