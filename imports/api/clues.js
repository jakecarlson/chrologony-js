import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

import { Categories } from '../api/categories';

export const Clues = new Mongo.Collection('clues');

if (Meteor.isServer) {

    Meteor.publish('clues', function cluesPublication() {
        if (this.userId) {
            return Clues.find({}, {sort: {date: -1}});
        } else {
            return this.ready();
        }
    });

}

Clues.helpers({
    category() {
        return Categories.findOne(this.categoryId);
    }
});

Meteor.methods({

    // Insert
    'clue.insert'(attrs) {

        check(attrs.description, String);
        check(attrs.date, String);
        check(attrs.categoryId, String);
        check(attrs.hint, String);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Add the theme
        attrs.theme = getTheme(attrs.categoryId);

        console.log('Create Clue:');
        console.log(attrs);

        // If there is an ID, this is an update
        return Clues.insert({
            description: attrs.description,
            date: attrs.date,
            categoryId: attrs.categoryId,
            theme: attrs.theme,
            hint: attrs.hint,
            active: true,
            owner: Meteor.userId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

    },

    // Update
    'clue.update'(attrs) {

        check(attrs._id, String);
        check(attrs.description, String);
        check(attrs.date, String);
        check(attrs.categoryId, String);
        check(attrs.hint, String);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Add the theme
        attrs.theme = getTheme(attrs.categoryId);

        console.log('Update Clue: ' + attrs._id);
        console.log(attrs);

        // If there is an ID, this is an update
        return Clues.update(
            {
                _id: attrs._id,
            },
            {
                $set: {
                    description: attrs.description,
                    date: attrs.date,
                    categoryId: attrs.categoryId,
                    theme: attrs.theme,
                    hint: attrs.hint,
                    updatedAt: new Date(),
                }
            }
        );

    },

    // Delete
    'clue.delete'(id) {

        check(id, String);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        console.log('Delete Clue: ' + id);

        // Remove the item
        return Clues.remove({_id: id});

    },

});

function getTheme(categoryId) {
    return Categories.findOne(categoryId).theme;
}