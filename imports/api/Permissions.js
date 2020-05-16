import { Meteor } from 'meteor/meteor';

export const Permissions = {

    authenticated() {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }
    },

    owned(item) {
        if (item.owner != Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }
    },

};