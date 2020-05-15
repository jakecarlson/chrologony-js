import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { NonEmptyString } from "../startup/validations";
import SimpleSchema from "simpl-schema";

export const Clues = new Mongo.Collection('clues');

Clues.schema = new SimpleSchema({
    description: {type: String, max: 240},
    date: {type: Date},
    hint: {type: String, max: 960, defaultValue: null, optional: true},
    active: {type: Boolean, defaultValue: true},
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
    categories: {type: Array},
    'categories.$': {type: String, regEx: SimpleSchema.RegEx.Id},
    thumbnailUrl: {type: String, max: 480, defaultValue: null, optional: true},
    imageUrl: {type: String, max: 480, defaultValue: null, optional: true},
    latitude: {type: Number, defaultValue: null, optional: true},
    longitude: {type: Number, defaultValue: null, optional: true},
    externalId: {type: String, defaultValue: null, optional: true},
    externalUrl: {type: String, max: 480, defaultValue: null, optional: true},
    moreInfo: {type: String, max: 3840, defaultValue: null, optional: true},
    createdAt: {
        type: Date,
        autoValue() {
            if (this.isInsert) {
                return new Date();
            }
            return undefined;
        },
    },
    updatedAt: {
        type: Date,
        autoValue() {
            return new Date();
        },
    },
});

Clues.attachSchema(Clues.schema);

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
    'clue.insert'(attrs) {

        check(attrs.description, NonEmptyString);
        check(attrs.date, NonEmptyString);
        check(attrs.categoryId, NonEmptyString);
        // check(attrs.hint, String);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

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

        check(attrs._id, NonEmptyString);
        check(attrs.description, NonEmptyString);
        check(attrs.date, NonEmptyString);
        // check(attrs.hint, String);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Convert date to ISODate
        attrs.date = new Date(attrs.date);

        Logger.log('Update Clue: ' + attrs._id + ' ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        return Clues.update(
            {
                _id: attrs._id,
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
    'clue.categories'(attrs) {

        check(attrs._id, NonEmptyString);
        check(attrs.categories, Array);

        // Make sure the user is logged in before inserting a task
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Logger.log('Update Clue Categories: ' + attrs._id + ' ' + JSON.stringify(attrs.categories));

        // Update the clue categories
        Clues.update(
            {
                _id: attrs._id,
            },
            {
                $set: {
                    categories: attrs.categories,
                }
            }
        );

        return attrs.categories.length;

    },

    // Delete
    'clue.delete'(id) {

        check(id, String);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Logger.log('Delete Clue: ' + id);

        // Remove the item
        return Clues.remove({_id: id});

    },

});