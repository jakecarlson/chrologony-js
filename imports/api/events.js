import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Categories } from '../api/categories';

export const Events = new Mongo.Collection('events');

if (Meteor.isServer) {
    Meteor.publish('events', function eventsPublication() {
        return Events.find({}, {sort:{date:-1}});
    });
}

Events.helpers({
    category() {
        return Categories.findOne(this.categoryId);
    }
});

Meteor.methods({

    // Insert
    'event.insert'(attrs) {

        check(attrs.clue, String);
        check(attrs.date, String);
        check(attrs.categoryId, String);
        check(attrs.hint, String);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        console.log(attrs);

        // If there is an ID, this is an update
        return Events.insert({
            clue: attrs.clue,
            date: attrs.date,
            categoryId: attrs.categoryId,
            hint: attrs.hint,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

    },

    // Update
    'event.update'(attrs) {

        check(attrs._id, String);
        check(attrs.clue, String);
        check(attrs.date, String);
        check(attrs.categoryId, String);
        check(attrs.hint, String);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        console.log(attrs);

        // If there is an ID, this is an update
        return Events.update(
            {
                _id: attrs._id,
            },
            {
                $set: {
                    clue: attrs.clue,
                    date: attrs.date,
                    categoryId: attrs.categoryId,
                    hint: attrs.hint,
                    updatedAt: new Date(),
                }
            }
        );

    },

});