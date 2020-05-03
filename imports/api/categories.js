import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { NonEmptyString } from "../startup/validations";

import { Clues } from '../api/clues';

export const Categories = new Mongo.Collection('categories');

if (Meteor.isServer) {
    Meteor.publish('categories', function categoriesPublication() {
        if (this.userId) {
            return Categories.find(
                {
                    $or: [
                        {private: false},
                        {owner: this.userId},
                    ],
                },
                {
                    sort: {name: 1}
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

        console.log('Insert Category:');
        console.log(attrs);

        // If there is an ID, this is an update
        return Categories.insert({
            name: attrs.name,
            theme: attrs.theme,
            private: attrs.private,
            active: attrs.active,
            owner: Meteor.userId(),
            source: 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
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

        console.log('Update Category: ' + attrs._id);
        console.log(attrs);

        // Update any clues with this category to the new theme
        let category = Categories.findOne(attrs._id);
        if (attrs.theme != category.theme) {
            let updatedClues = Clues.update(
                {
                    categoryId: attrs._id
                },
                {
                    $set: {
                        theme: attrs.theme,
                        updatedAt: new Date(),
                    }
                },
                {
                    multi: true,
                }
            );
            console.log("Updated Clues to New Theme: " + updatedClues);
        }

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
                    updatedAt: new Date(),
                }
            }
        );

    },

    // Delete
    'category.delete'(id) {

        check(id, NonEmptyString);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        console.log('Delete Category: ' + id);

        // Remove the item
        return Categories.remove({_id: id});

    },

});