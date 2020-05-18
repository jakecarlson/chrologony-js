import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';
import SimpleSchema from "simpl-schema";
import { Schemas } from "../modules/Schemas";

export const Categories = new Mongo.Collection('categories');

Categories.schema = new SimpleSchema({
    name: {type: String, max: 80},
    active: {type: Boolean, defaultValue: false},
    private: {type: Boolean, defaultValue: true},
    theme: {type: String, max: 40},
    source: {type: String, max: 40, defaultValue: 'user'},
    collaborators: {type: Array, defaultValue: [], optional: true},
    'collaborators.$': {type: String, regEx: SimpleSchema.RegEx.Id},
});
Categories.schema.extend(Schemas.timestampable);
Categories.schema.extend(Schemas.ownable);
Categories.attachSchema(Categories.schema);

Categories.helpers({

    colabborators() {
        console.log('category.collaborators');
        return Meteor.users.find(
            {
                _id: {$in: this.collaborators},
            },
            {
                sort: {username: 1},
            }
        );
    },

    owner() {
        return Meteor.users.findOne(this.ownerId);
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
    'category.create'(attrs) {

        check(
            attrs,
            {
                name: NonEmptyString,
                theme: NonEmptyString,
                private: Boolean,
                active: Boolean,
            }
        );
        Permissions.authenticated();

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

        check(
            attrs,
            {
                _id: RecordId,
                name: NonEmptyString,
                theme: NonEmptyString,
                private: Boolean,
                active: Boolean,
            }
        );
        Permissions.authenticated();

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
        Permissions.authenticated();

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
        Permissions.authenticated();

        Logger.log('Delete Category: ' + id);

        // Remove the item
        return Categories.remove(
            {
                _id: id,
                ownerId: Meteor.userId(),
            }
        );

    },

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

            check(ids, [RecordId]);
            Permissions.authenticated();

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
        {ownerId: Meteor.userId()},
        {collaborators: Meteor.userId()},
    ];
}

function getSort() {
    return {theme: 1, name: 1};
}