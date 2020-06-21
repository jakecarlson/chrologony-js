import { Meteor } from 'meteor/meteor';
import { Categories } from "../api/Categories";

export const Permissions = {

    check(allowed) {
        if (!allowed) {
            throw new Meteor.Error('not-authorized');
        }
    },

    authenticated() {
        return Meteor.userId();
    },

    owned(item) {
        return (item.ownerId == Meteor.userId());
    },

};