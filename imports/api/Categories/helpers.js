import { Meteor } from 'meteor/meteor';
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { Permissions } from '../../modules/Permissions';

import { Categories } from "./index";

Categories.helpers({

    collaborators() {
        return Meteor.users.find(
            {
                _id: {$in: this.collaborators},
            },
            {
                sort: {
                    'profile.name': 1,
                },
            }
        );
    },

    owner() {
        return Meteor.users.findOne(this.ownerId);
    },

    label() {
        return Helpers.getCategoryLabel(this);
    },

    cluesLink() {
        return FlowRouter.url('/clues/:categoryId', {categoryId: this._id});
    },

    canAddClue() {
        return (
            Permissions.owned(this, true) ||
            (
                this.collaborators &&
                this.collaborators.includes(Meteor.userId())
            )
        );
    },

});