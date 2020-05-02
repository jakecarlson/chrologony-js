import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import './flasher.html';

export const Flasher = {

    type() {
        return (Session.get('flasher')) ? Session.get('flasher').type : false;
    },

    msg() {
        return (Session.get('flasher')) ? Session.get('flasher').msg : false;
    },

    set(type, msg) {
        Session.set('flasher', {type: type, msg: msg});
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