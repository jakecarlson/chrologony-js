import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';
import SimpleSchema from "simpl-schema";
import { Schemas } from "../modules/Schemas";

import { Games } from "./Games";
import { Clues } from "./Clues";

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
Categories.schema.extend(Schemas.ownable);
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

    canAddClue() {
        return (
            Permissions.owned(this) ||
            (
                this.collaborators &&
                this.collaborators.includes &&
                this.collaborators.includes(Meteor.userId())
            )
        );
    },

});

if (Meteor.isServer) {

    Meteor.publish('categories', function categoriesPublication() {
        if (this.userId) {
            return Categories.find(
                {
                    $or: getAllowedConditions(),
                },
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
        Permissions.check(Permissions.authenticated());
        Permissions.check(Permissions.notGuest());
        Permissions.check(Games.PRECISION_OPTIONS.includes(attrs.precision));

        Logger.log('Insert Category: ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        return Categories.insert({
            name: attrs.name,
            theme: attrs.theme,
            precision: attrs.precision,
            private: attrs.private,
            active: attrs.active,
        });

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
        Permissions.check(Permissions.authenticated());
        Permissions.check(Permissions.notGuest());
        Permissions.check(Permissions.owned(Categories.findOne(attrs._id)));
        Permissions.check(Games.PRECISION_OPTIONS.includes(attrs.precision));

        Logger.log('Update Category: ' + attrs._id + ' ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        return Categories.update(
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

    },

    // Collaborators
    'category.setCollaborators'(id, collaborators) {

        check(id, RecordId);
        check(collaborators, [RecordId]);
        Permissions.check(Permissions.authenticated());
        Permissions.check(Permissions.notGuest());
        Permissions.check(Permissions.owned(Categories.findOne(id)));

        Logger.log('Update Category Collaborators: ' + id + ' ' + JSON.stringify(collaborators));

        // Update the category collaborators
        Categories.update(
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

        return collaborators.length;

    },

    // Delete
    'category.remove'(id) {

        check(id, RecordId);
        Permissions.check(Permissions.authenticated());
        Permissions.check(Permissions.notGuest());
        Permissions.check(Permissions.owned(Categories.findOne(id)));

        Logger.log('Delete Category: ' + id);

        // Remove the item
        return Categories.remove(
            {
                _id: id,
                ownerId: Meteor.userId(),
            }
        );

    },

    'category.updateClueCounts'(ids) {

        Permissions.check(Permissions.authenticated());
        Permissions.check(Permissions.notGuest());

        ids.forEach(function(id) {
            const cluesCount = Clues.find({categories: id, active: true}).count();
            Categories.update(id, {$set: {cluesCount: cluesCount}});
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
            Permissions.check(Permissions.authenticated());
            Permissions.check(Permissions.notGuest());

            const regex = new RegExp(query, 'i');
            const selector = {
                $and: [
                    {active: true, source: 'user'},
                    {_id: {$nin: excludeIds}},
                    // {$text: {$search: query}},
                    {$or: [{theme: {$regex: regex}}, {name: {$regex: regex}}]},
                    {$or: getAllowedConditions()},
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
            Permissions.check(Permissions.authenticated());
            Permissions.check(Permissions.notGuest());

            return Categories.find(
                {
                    _id: {$in: ids},
                    $or: getAllowedConditions(),
                },
                {
                    sort: getSort(),
                }
            ).fetch();
        },

    });

}

function getAllowedConditions() {
    return [
        {ownerId: Meteor.userId()},
        {private: false},
        {collaborators: Meteor.userId()},
    ];
}

function getSort() {
    return {theme: 1, name: 1};
}