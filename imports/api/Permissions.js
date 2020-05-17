import { Meteor } from 'meteor/meteor';

export const Permissions = {

    authenticated() {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }
    },

    owned(item) {
        if (item.ownerId != Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }
    },

};