import { Meteor } from 'meteor/meteor';
import { Categories } from "../api/Categories";

export const Permissions = {

    check(allowed, ret = false) {
        if (!allowed) {
            if (ret) {
                return false;
            }
            throw new Meteor.Error('not-authorized');
        }
        return true;
    },

    authenticated(ret = false) {
        return this.check(Meteor.userId(), ret);
    },

    notGuest(ret = false) {
        return this.check(!Meteor.user().guest, ret);
    },

    owned(item, ret = false) {
        return this.check((item.ownerId == Meteor.userId()), ret);
    },

    clue: {

        canEdit(clue, categoryId) {
            if (Permissions.owned(clue, true)) {
                return true;
            }
            const category = Categories.findOne(categoryId);
            if (category && Permissions.owned(category, true)) {
                return true;
            }
            return false;
        },

    },

};