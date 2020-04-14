import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './card.html';

Template.room.helpers({

});

Template.card.events({
    /*'click .delete'() {
        Meteor.call('rooms.remove', this._id);
    },
    'click .toggle-private'() {
        Meteor.call('rooms.setPrivate', this._id, !this.private);
    },*/
});
