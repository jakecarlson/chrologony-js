import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';
import SimpleSchema from "simpl-schema";
import { Schemas } from "../modules/Schemas";

import { Games } from "./Games";
import { Clues } from "./Clues";
import {FlowRouter} from "meteor/ostrio:flow-router-extra";

export const Categories = new Mongo.Collection('categories');

Categories.schema = new SimpleSchema({
    name: {type: String, max: 80},
    active: {type: Boolean, defaultValue: false},
    private: {type: Boolean, defaultValue: true},
    theme: {type: String, max: 40},
    source: {type: String, max: 40, defaultValue: 'user'},
    collaborators: {type: Array, defaultValue: [], optional: true},
    'collaborators.$': {type: String, regEx: SimpleSchema.RegEx.Id},
    precision: {type: String, defaultValue: 'date'},
    cluesCount: {type: SimpleSchema.Integer, defaultValue: 0, optional: true},
});
Categories.schema.extend(Schemas.timestampable);
Categories.schema.extend(Schemas.ownable());
Categories.attachSchema(Categories.schema);

// Collection hooks
Categories.after.insert(function(id, category) {
    Logger.auditCreate('Categories', id, category);
});
Categories.after.update(function(id, category) {
    Logger.auditUpdate('Categories', id, this.previous, category, ['clueCount']);
});
Categories.after.remove(function(id, category) {
    Logger.auditDelete('Categories', id);
});

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
        let str = '';
        if (this.source == 'user') {
            str += this.theme + ': '
        }
        str += this.name + ' (' + numeral(this.cluesCount).format('0,0') + ')';
        return str;
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

if (Meteor.isServer) {

    Meteor.publish('categories', function categoriesPublication() {
        if (this.userId) {
            return Categories.find(
                Helpers.getCategoriesSelector(),
                {
                    fields: {
                        _id: 1,
                        name: 1,
                        theme: 1,
                        active: 1,
                        private: 1,
                        source: 1,
                        collaborators: 1,
                        ownerId: 1,
                        precision: 1,
                        cluesCount: 1,
                    },
                }
            );
        } else {
            return this.ready();
        }
    });

}

Meteor.methods({

    // Insert
    'category.create'(attrs) {

        check(
            attrs,
            {
                name: NonEmptyString,
                theme: NonEmptyString,
                precision: NonEmptyString,
                private: Boolean,
                active: Boolean,
            }
        );
        Permissions.authenticated();
        Permissions.notGuest();
        Permissions.check(Games.PRECISION_OPTIONS.includes(attrs.precision));

        Logger.log('Insert Category: ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        try {
            return Categories.insert({
                name: attrs.name,
                theme: attrs.theme,
                precision: attrs.precision,
                private: attrs.private,
                active: attrs.active,
            });
        } catch(err) {
            throw new Meteor.Error('category-not-inserted', 'Could not create a category.', err);
        }

    },

    // Update
    'category.update'(attrs) {

        check(
            attrs,
            {
                _id: RecordId,
                name: NonEmptyString,
                theme: NonEmptyString,
                precision: NonEmptyString,
                private: Boolean,
                active: Boolean,
            }
        );
        Permissions.authenticated();
        Permissions.notGuest();
        Permissions.owned(Categories.findOne(attrs._id));
        Permissions.check(Games.PRECISION_OPTIONS.includes(attrs.precision));

        Logger.log('Update Category: ' + attrs._id + ' ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        const updated = Categories.update(
            {
                _id: attrs._id,
                ownerId: Meteor.userId(),
            },
            {
                $set: {
                    name: attrs.name,
                    theme: attrs.theme,
                    precision: attrs.precision,
                    private: attrs.private,
                    active: attrs.active,
                }
            }
        );
        if (!updated) {
            throw new Meteor.Error('category-not-updated', 'Could not update a category.');
        }

        return updated;

    },

    // Collaborators
    'category.setCollaborators'(id, collaborators) {

        check(id, RecordId);
        check(collaborators, [RecordId]);
        Permissions.authenticated();
        Permissions.notGuest();
        Permissions.owned(Categories.findOne(id));

        Logger.log('Update Category Collaborators: ' + id + ' ' + JSON.stringify(collaborators));

        this.unblock();

        // Get added and removed collaborators
        const category = Categories.findOne(id);
        const previousCollaborators = category.collaborators;

        // Update the category collaborators
        const updated = Categories.update(
            {
                _id: id,
                ownerId: Meteor.userId(),
            },
            {
                $set: {
                    collaborators: collaborators,
                }
            }
        );
        if (!updated) {
            throw new Meteor.Error('category-not-updated', 'Could not set collaborators on a category.');
        }

        // Send out emails informing users of the invitations / disinvitation
        const addedCollaborators = _.difference(collaborators, previousCollaborators);
        const removedCollaborators = _.difference(previousCollaborators, collaborators);
        addedCollaborators.forEach(function(userId) {
            sendCollaboratorEmail(category, userId, 'add');
        });
        removedCollaborators.forEach(function(userId) {
            sendCollaboratorEmail(category, userId, 'remove');
        });

        return collaborators.length;

    },

    // Delete
    'category.remove'(id) {

        check(id, RecordId);
        Permissions.authenticated();
        Permissions.notGuest();
        Permissions.owned(Categories.findOne(id));

        Logger.log('Delete Category: ' + id);

        // Remove the item
        const removed = Categories.remove(
            {
                _id: id,
                ownerId: Meteor.userId(),
            }
        );
        if (!removed) {
            throw new Meteor.Error('category-not-removed', 'Could not remove a category.');
        }

        return removed;

    },

    'category.updateClueCounts'(ids) {

        Permissions.authenticated();
        Permissions.notGuest();

        ids.forEach(function(id) {
            const cluesCount = Clues.find({categories: id, active: true}).count();
            const updated = Categories.update(id, {$set: {cluesCount: cluesCount}});
            if (!updated) {
                throw new Meteor.Error('category-not-updated', 'Could not update clue count for a category.');
            }
        });

        return ids.length;

    }

});

if (Meteor.isServer) {

    Meteor.methods({

        // Search
        'category.search'(query, excludeIds = []) {

            if (typeof(excludeIds) != 'object') {
                excludeIds = [excludeIds];
            }

            check(query, NonEmptyString);
            check(excludeIds, [RecordId]);
            Permissions.authenticated();
            Permissions.notGuest();

            const regex = new RegExp(query, 'i');

            const selector = {
                $and: [
                    Helpers.getCategoriesSelector({exclude: excludeIds, editor: true}),
                    // {$text: {$search: query}},
                    {$or: [{theme: {$regex: regex}}, {name: {$regex: regex}}]},
                ],
            };
            return Categories.find(
                selector,
                {
                    sort: getSort(),
                }
            ).fetch();

        },

        // Get
        'category.get'(ids) {

            if (typeof(ids) != 'object') {
                ids = [ids];
            }

            check(ids, [RecordId]);
            Permissions.authenticated();
            Permissions.notGuest();

            let selector = Helpers.getCategoriesSelector();
            selector._id = {$in: ids};
            return Categories.find(
                selector,
                {
                    sort: getSort(),
                }
            ).fetch();
        },

    });

}

function getSort() {
    return {theme: 1, name: 1};
}

function sendCollaboratorEmail(category, userId, action, text) {

    Logger.audit(
        action + 'Collaborator',
        {
            collection: 'Categories',
            documentId: category._id,
            attrs: {userId: userId}
        }
    );

    const user = Meteor.users.findOne(userId);
    if (user && user.email()) {

        const collaborator = Helpers.renderHtmlEmail({
            subject: Meteor.settings.public.app.collaborator[action].subject,
            preview: Meteor.settings.public.app.collaborator[action].preview,
            template: 'category_collaborator_' + action,
            data: {
                collaborator: user.name(),
                inviter: Meteor.user().name(),
                title: category.name,
                url: category.cluesLink(),
            },
        });

        Email.send({
            from: Meteor.settings.public.app.sendEmail,
            to: user.email(),
            subject: Meteor.settings.public.app.collaborator[action].subject,
            text: collaborator.text,
            html: collaborator.html,
        });

    }

}