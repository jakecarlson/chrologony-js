import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { NonEmptyString } from "../startup/validations";
import SimpleSchema from "simpl-schema";
import { Schema } from "./Schema";

export const Categories = new Mongo.Collection('categories');

Categories.schema = new SimpleSchema({
    name: {type: String, max: 80},
    active: {type: Boolean, defaultValue: false},
    private: {type: Boolean, defaultValue: true},
    theme: {type: String, max: 40},
    source: {type: String, max: 40, defaultValue: 'user'},
    owner: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        autoValue() {
            if (this.isInsert) {
                return this.userId;
            }
            return undefined;
        },
    },
    collaborators: {type: Array},
    'collaborators.$': {type: String, regEx: SimpleSchema.RegEx.Id},
});
Categories.schema.extend(Schema.timestamps);
Categories.attachSchema(Categories.schema);

if (Meteor.isServer) {
    Meteor.publish('categories', function categoriesPublication() {
        if (this.userId) {
            return Categories.find(
                {
                    $or: getAllowedConditions(),
                },
                {
                    sort: getSort(),
                }
            );
        } else {
            return this.ready();
        }
    });
}

Meteor.methods({

    // Insert
    'category.insert'(attrs) {

        check(attrs.name, NonEmptyString);
        check(attrs.private, Boolean);
        check(attrs.active, Boolean);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Logger.log('Insert Category: ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        return Categories.insert({
            name: attrs.name,
            theme: attrs.theme,
            private: attrs.private,
            active: attrs.active,
        });

    },

    // Update
    'category.update'(attrs) {

        check(attrs._id, NonEmptyString);
        check(attrs.name, NonEmptyString);
        check(attrs.theme, NonEmptyString);
        check(attrs.private, Boolean);
        check(attrs.active, Boolean);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Logger.log('Update Category: ' + attrs._id + ' ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        return Categories.update(
            {
                _id: attrs._id,
            },
            {
                $set: {
                    name: attrs.name,
                    theme: attrs.theme,
                    private: attrs.private,
                    active: attrs.active,
                }
            }
        );

    },

    // Collaborators
    'category.collaborators'(attrs) {

        check(attrs._id, NonEmptyString);
        check(attrs.collaborators, Array);

        // Make sure the user is logged in before inserting a task
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Logger.log('Update Category Collaborators: ' + attrs._id + ' ' + JSON.stringify(attrs.collaborators));

        // Update the category collaborators
        Categories.update(
            {
                _id: attrs._id,
            },
            {
                $set: {
                    collaborators: attrs.collaborators,
                }
            }
        );

        return attrs.collaborators.length;

    },

    // Delete
    'category.delete'(id) {

        check(id, NonEmptyString);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Logger.log('Delete Category: ' + id);

        // Remove the item
        return Categories.remove({_id: id});

    },

});

if (Meteor.isServer) {

    Meteor.methods({

        // Search
        'category.search'(query, excludeIds = []) {
            if (typeof(excludeIds) != 'object') {
                excludeIds = [excludeIds];
            }
            const regex = new RegExp("^" + query, 'i');
            return Categories.find(
                {
                    $and: [
                        {$or: [{theme: {$regex: regex}}, {name: {$regex: regex}}]},
                        {$or: getAllowedConditions()},
                        {_id: {$nin: excludeIds}},
                    ],
                },
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
        {private: false},
        {owner: Meteor.userId()},
        {collaborators: Meteor.userId()},
    ];
}

function getSort() {
    return {theme: 1, name: 1};
}