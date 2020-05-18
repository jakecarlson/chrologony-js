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
        thumbnailUrl: {type: String, max: 480, defaultValue: null},
        imageUrl: {type: String, max: 480, defaultValue: null},
        latitude: {type: Number, defaultValue: null},
        longitude: {type: Number, defaultValue: null},
        externalId: {type: String, defaultValue: null},
        externalUrl: {type: String, max: 480, defaultValue: null},
        moreInfo: {type: String, max: 3840, defaultValue: null},
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

});

if (Meteor.isServer) {
    Meteor.publish('clues', function cluesPublication(categoryId) {
        if (this.userId && categoryId) {
            return Clues.find({categories: categoryId}, {sort: {date: -1}});
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
                hint: Match.OneOf(null, String),
            }
        );
        Permissions.authenticated();

        // Convert date to ISODate
        attrs.date = new Date(attrs.date);

        Logger.log('Create Clue: ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        return Clues.insert({
            description: attrs.description,
            date: attrs.date,
            categories: [attrs.categoryId],
            // hint: attrs.hint,
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
                hint: Match.OneOf(null, String),
            }
        );
        Permissions.authenticated();

        // Convert date to ISODate
        attrs.date = new Date(attrs.date);

        Logger.log('Update Clue: ' + attrs._id + ' ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        return Clues.update(
            {
                _id: attrs._id,
                ownerId: Meteor.userId(),
            },
            {
                $set: {
                    description: attrs.description,
                    date: attrs.date,
                    // hint: attrs.hint,
                }
            }
        );

    },

    // Categories
    'clue.setCategories'(id, categories) {

        check(id, RecordId);
        check(categories, [RecordId]);
        Permissions.authenticated();

        Logger.log('Update Clue Categories: ' + id + ' ' + JSON.stringify(categories));

        // Update the clue categories
        Clues.update(
            {
                _id: id,
                ownerId: Meteor.userId(),
            },
            {
                $set: {
                    categories: categories,
                }
            }
        );

        return categories.length;

    },

    // Delete
    'clue.remove'(id) {

        check(id, RecordId);
        Permissions.authenticated();

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