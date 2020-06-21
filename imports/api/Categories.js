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
        return (Permissions.owned(this) || this.collaborators.includes(Meteor.userId()));
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
                private: Boolean,
                active: Boolean,
            }
        );
        Permissions.check(Permissions.authenticated());

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
        Permissions.check(Permissions.authenticated());
        Permissions.check(Permissions.owned(Categories.findOne(attrs._id)));

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
        Permissions.check(Permissions.authenticated());
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

            const regex = new RegExp("^" + query, 'i');
            const selector ={
                $and: [
                    {active: true, source: 'user'},
                    {$or: [{theme: {$regex: regex}}, {name: {$regex: regex}}]},
                    {$or: getAllowedConditions()},
                    {_id: {$nin: excludeIds}},
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