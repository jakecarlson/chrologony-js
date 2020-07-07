import {Meteor} from "meteor/meteor";

Helpers = {

    getValues(cursor, field) {
        return cursor.fetch().map(function(item) { return item[field]; })
    },

    getIds(cursor) {
        return this.getValues(cursor, '_id');
    },

    getCategoriesSelector(isPrivate = null, hideNonUser = false, showInactive = false, excludeCategoryId = null) {
        let selector = {};
        if (!showInactive) {
            selector.active = true;
        };
        if (isPrivate !== false) {
            selector.$or = [
                {ownerId: Meteor.userId()},
                {collaborators: Meteor.userId()},
            ];
        }
        if (isPrivate === null) {
            selector.$or.push({private: false});
        } else {
            selector.private = isPrivate;
        }
        if (hideNonUser) {
            selector.source = 'user';
        }
        if (excludeCategoryId) {
            selector._id = {$ne: excludeCategoryId};
        }
        return selector;
    },

    getPageStart(pageNum, pageSize) {
        return (pageNum - 1) * pageSize;
    },

};