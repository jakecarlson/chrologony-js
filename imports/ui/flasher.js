import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { LoadingState } from "../modules/LoadingState";

import './flasher.html';

export const Flasher = {

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

Template.flasher.onCreated(function flasherOnCreated() {

});

Template.flasher.helpers({

    id() {
        return (this.id) ? this.id : null;
    },

    has() {
        return Flasher.msg();
    },

    msg() {
        return Flasher.msg();
    },

    type() {
        return Flasher.type();
    },

});

Template.flasher.events({

    'click .close'(e, i) {
        Flasher.clear();
    },

});