import { Template } from 'meteor/templating';

import './flasher.html';

Template.flasher.onCreated(function flasherOnCreated() {

});

Template.flasher.helpers({

    id() {
        return (this.id) ? this.id : 'alert';
    },

    hidden() {
        return !Flasher.msg();
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