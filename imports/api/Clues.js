import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';
import SimpleSchema from "simpl-schema";
import { Schemas } from "../modules/Schemas";

import { Categories } from "./Categories";

export const Clues = new Mongo.Collection('clues');

Clues.schema = new SimpleSchema(
    {
        description: {type: String, max: 240, required: true},
        date: {type: Date, required: true},
        hint: {type: String, max: 960, defaultValue: null},
        active: {type: Boolean, defaultValue: true, required: true},
        categories: {type: Array, minCount: 1, required: true},
        'categories.$': {type: String, regEx: SimpleSchema.RegEx.Id},
        thumbnailUrl: {type: SimpleSchema.RegEx.Url, max: 960, defaultValue: null},
        imageUrl: {type: SimpleSchema.RegEx.Url, max: 960, defaultValue: null},
        latitude: {type: Number, defaultValue: null},
        longitude: {type: Number, defaultValue: null},
        externalId: {type: String, defaultValue: null},
        externalUrl: {type: SimpleSchema.RegEx.Url, max: 960, defaultValue: null},
        moreInfo: {type: String, max: 3840, defaultValue: null},
        importId: {type: String, defaultValue: null, max: 27, optional: true},
        importSetId: {type: RecordId, defaultValue: null, optional: true},
    },
    {
        requiredByDefault: false,
    }
);
Clues.schema.extend(Schemas.timestampable);
Clues.schema.extend(Schemas.ownable);
Clues.attachSchema(Clues.schema);

Clues.helpers({

    categories() {
        return Categories.find(
            {
                _id: {$in: this.categories},
            },
            {
                sort: {
                    theme: 1,
                    name: 1,
                },
            }
        );
    },

    owner() {
        return Meteor.users.findOne(this.ownerId);
    },

    dateObj() {
        if (this.date) {
            return moment.utc(this.date);
        }
        return null;
    },

    formattedDate() {
        if (this.date) {
            return Formatter.date(this.dateObj());
        }
        return null;
    },

    year() {
        if (this.date) {
            return Formatter.year(this.dateObj());
        }
        return null;
    },

    canEdit(categoryId) {
        if (Permissions.owned(this)) {
            return true;
        }
        const category = Categories.findOne(categoryId);
        if (category && Permissions.owned(category)) {
            return true;
        }
        return false;
    },

    canSetCategories(categories) {
        const userCategories = Helpers.getIds(Categories.find(Helpers.getCategoriesSelector(null, false)));
        const whitelistedCategories = this.categories.concat(userCategories);
        const allowedCategories = categories.filter(function(item) {
            return whitelistedCategories.includes(item);
        });
        return (categories.length == allowedCategories.length);
    },

});

if (Meteor.isServer) {

    Meteor.publish('clues', function cluesPublication(categoryId) {
        if (this.userId && categoryId) {
            return Clues.find(
                {
                    categories: categoryId,
                },
                {
                    fields: {
                        _id: 1,
                        description: 1,
                        date: 1,
                        active: 1,
                        categories: 1,
                        ownerId: 1,
                        hint: 1,
                        thumbnailUrl: 1,
                        imageUrl: 1,
                        latitude: 1,
                        longitude: 1,
                        externalId: 1,
                        externalUrl: 1,
                        moreInfo: 1,
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
    'clue.create'(attrs) {

        check(
            attrs,
            {
                description: NonEmptyString,
                date: NonEmptyString,
                categoryId: RecordId,
            }
        );
        Permissions.check(Permissions.authenticated());
        Permissions.check(Categories.findOne(attrs.categoryId).canAddClue());

        // Convert date to ISODate
        attrs.date = new Date(attrs.date);

        Logger.log('Create Clue: ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        return Clues.insert({
            description: attrs.description,
            date: attrs.date,
            categories: [attrs.categoryId],
        });

    },

    // Update
    'clue.update'(attrs) {

        check(
            attrs,
            {
                _id: RecordId,
                description: NonEmptyString,
                date: NonEmptyString,
                categoryId: RecordId,
            }
        );
        Permissions.check(Permissions.authenticated());
        Permissions.check(Clues.findOne(attrs._id).canEdit(attrs.categoryId));

        // Convert date to ISODate
        attrs.date = new Date(attrs.date);

        Logger.log('Update Clue: ' + attrs._id + ' ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        return Clues.update(
            getClueUpdateSelector(attrs),
            {
                $set: {
                    description: attrs.description,
                    date: attrs.date,
                }
            }
        );

    },

    // Categories
    'clue.setCategories'(id, categories) {

        check(id, RecordId);
        check(categories, [RecordId]);
        Permissions.check(Permissions.authenticated());
        Permissions.check(Clues.findOne(id).canSetCategories(categories))

        Logger.log('Update Clue Categories: ' + id + ' ' + JSON.stringify(categories));

        // Update the clue categories
        Clues.update(
            {
                _id: id,
            },
            {
                $set: {
                    categories: categories,
                }
            }
        );

        return categories.length;

    },

    // Update More Info
    'clue.updateMore'(attrs) {

        check(
            attrs,
            {
                _id: RecordId,
                categoryId: RecordId,
                externalUrl: Match.OneOf(null, String),
                externalId: Match.OneOf(null, String),
                thumbnailUrl: Match.OneOf(null, String),
                imageUrl: Match.OneOf(null, String),
                latitude: Match.OneOf(null, Number),
                longitude: Match.OneOf(null, Number),
                hint: Match.OneOf(null, String),
                moreInfo: Match.OneOf(null, String),
            }
        );
        Permissions.check(Permissions.authenticated());
        Permissions.check(Clues.findOne(attrs._id).canEdit(attrs.categoryId));

        Logger.log('Update Clue: ' + attrs._id + ' ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        return Clues.update(
            getClueUpdateSelector(attrs),
            {
                $set: {
                    externalUrl: attrs.externalUrl,
                    externalId: attrs.externalId,
                    thumbnailUrl: attrs.thumbnailUrl,
                    imageUrl: attrs.imageUrl,
                    latitude: attrs.latitude,
                    longitude: attrs.longitude,
                    hint: attrs.hint,
                    moreInfo: attrs.moreInfo,
                }
            }
        );

    },

    // Delete
    'clue.remove'(id) {

        check(id, RecordId);
        Permissions.check(Permissions.authenticated());
        Permissions.check(Permissions.owned(Clues.findOne(id)));

        Logger.log('Delete Clue: ' + id);

        // Remove the item
        return Clues.remove(
            {
                _id: id,
                ownerId: Meteor.userId(),
            }
        );

    },

});


if (Meteor.isServer) {

    Meteor.methods({

        // Add a category to clues
        'clue.addCategory'(selector, categoryId) {

            check(selector, Object);
            check(categoryId, RecordId);

            return Clues.update(
                selector,
                {$push: {categories: categoryId}},
                {multi: true}
            );

        },

        // Remove a category from clues
        'clue.removeCategory'(selector, categoryId) {

            check(selector, Object);
            check(categoryId, RecordId);

            return Clues.update(
                selector,
                {$pull: {categories: categoryId}},
                {multi: true}
            );

        },

        // Get the full clue data
        'clue.get'(id) {
            const clue = Clues.findOne(id);
            return clue;
        },

    });

}

function getClueUpdateSelector(attrs) {
    let selector = {
        _id: attrs._id,
        $or: [
            {ownerId: Meteor.userId()},
        ],
    };
    if (attrs.categoryId) {
        const category = Categories.findOne(attrs.categoryId);
        if (category.ownerId == Meteor.userId()) {
            selector.$or.push({categories: attrs.categoryId});
        }
    }
    return selector;
}