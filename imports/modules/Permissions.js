import { Meteor } from 'meteor/meteor';
import {Categories} from "../api/Categories";

export const Permissions = {

    check(allowed) {
        if (!allowed) {
            throw new Meteor.Error('not-authorized');
        }
    },

    authenticated() {
        return Meteor.userId();
    },

    notGuest() {
        return !Meteor.user().guest;
    },

    owned(item) {
        return (item.ownerId == Meteor.userId());
    },

    clue: {

        canEdit(clue, categoryId) {
            if (Permissions.owned(clue)) {
                return true;
            }
            const category = Categories.findOne(categoryId);
            if (category && Permissions.owned(category)) {
                return true;
            }
            return false;
        },

    },

};