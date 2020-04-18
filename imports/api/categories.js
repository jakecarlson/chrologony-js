import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Events } from "./events";

export const Categories = new Mongo.Collection('categories');

if (Meteor.isServer) {
    Meteor.publish('categories', function categoriesPublication() {
        // return Categories.find({/*owner: {$in: [ Meteor.userId(), null ]}*/}, {sort:{name:1}});
        return Categories.find({});
    });
}

Meteor.methods({

    // Insert
    'category.insert'(attrs) {

        check(attrs.name, String);
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
            private: attrs.private,
            active: attrs.active,
            owner: Meteor.userId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

    },

    // Update
    'category.update'(attrs) {

        check(attrs._id, String);
        check(attrs.name, String);
        check(attrs.private, Boolean);
        check(attrs.active, Boolean);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        console.log('Update Category: ' + attrs._id);
        console.log(attrs);

        // If there is an ID, this is an update
        return Categories.update(
            {
                _id: attrs._id,
            },
            {
                $set: {
                    name: attrs.name,
                    private: attrs.private,
                    active: attrs.active,
                    updatedAt: new Date(),
                }
            }
        );

    },

});