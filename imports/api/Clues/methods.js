import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { Promise } from "meteor/promise";
import { NonEmptyString, RecordId } from "../../startup/validations";
import { Permissions } from '../../modules/Permissions';
import SimpleSchema from "simpl-schema";
import { Schemas } from "../../modules/Schemas";

import { Categories } from "../Categories";
import { Games } from "../Games";
import { Cards } from "../Cards";
import { Votes } from "../Votes";
import moment from "moment-timezone";
import {Clues} from "./index";

Meteor.methods({

    // Insert
    'clue.create'(attrs) {

        check(
            attrs,
            {
                description: NonEmptyString,
                date: NonEmptyString,
                timeZone: Match.OneOf(null, String),
                categoryId: RecordId,
            }
        );
        Permissions.authenticated();
        Permissions.notGuest();
        const category = Categories.findOne(attrs.categoryId);
        Permissions.check((category && category.canAddClue()));

        // Convert date to ISODate
        attrs.date = new Date(attrs.date);

        // Default time zone to UTC
        if (!attrs.timeZone) {
            attrs.timeZone = Clues.DEFAULT_TIMEZONE;
        }

        Logger.log('Create Clue: ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        try {
            return Clues.insert({
                description: attrs.description,
                date: attrs.date,
                timeZone: attrs.timeZone,
                categories: [attrs.categoryId],
            });
        } catch(err) {
            throw new Meteor.Error('clue-not-inserted', 'Could not create a clue.', err);
        }

    },

    // Update
    'clue.update'(attrs) {

        check(
            attrs,
            {
                _id: String,
                description: NonEmptyString,
                date: NonEmptyString,
                timeZone: String,
                categoryId: RecordId,
                active: Boolean,
                open: Boolean,
            }
        );
        Permissions.authenticated();
        Permissions.notGuest();
        const clue = Clues.findOne(attrs._id);
        Permissions.check(clue.canEdit(attrs.categoryId));

        // Convert date to ISODate
        attrs.date = new Date(attrs.date);

        Logger.log('Update Clue: ' + attrs._id + ' ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        const updated = Clues.update(
            getClueUpdateSelector(clue, attrs.categoryId),
            {
                $set: {
                    description: attrs.description,
                    date: attrs.date,
                    timeZone: attrs.timeZone,
                    active: attrs.active,
                    open: attrs.open,
                }
            }
        );
        if (!updated) {
            throw new Meteor.Error('clue-not-updated', 'Could not update a clue.');
        }

        return updated;

    },

    // Set Categories
    'clue.setCategories'(id, categories) {

        check(id, RecordId);
        check(categories, [RecordId]);
        Permissions.authenticated();
        Permissions.notGuest();
        Permissions.check(Clues.findOne(id).canSetCategories(categories))

        Logger.log('Update Clue Categories: ' + id + ' ' + JSON.stringify(categories));

        // Update the clue categories
        const updated = Clues.update(
            {
                _id: id,
            },
            {
                $set: {
                    categories: categories,
                }
            }
        );
        if (!updated) {
            throw new Meteor.Error('clue-not-updated', 'Could not update categories on a clue.');
        }

        return categories.length;

    },

    // Add Category
    'clue.addCategory'(ids, categoryId) {

        check(ids, [String]);
        check(categoryId, RecordId);
        Permissions.authenticated();
        Permissions.notGuest();
        ids.forEach(function(id) {
            Permissions.check(Clues.findOne(id).canSetCategories([categoryId]));
        });

        Logger.log('Add category ' + categoryId + ' to: ' + JSON.stringify(ids));

        // Update the clue categories
        const updated = Clues.update(
            {
                _id: {$in: ids},
            },
            {
                $addToSet: {categories: categoryId}
            },
            {multi: true}
        );
        if (!updated) {
            throw new Meteor.Error('clue-not-updated', 'Could not add a category to a clue.');
        }

        return updated;

    },

    // Remove Category
    'clue.removeCategory'(ids, categoryId) {

        check(ids, [String]);
        check(categoryId, RecordId);
        Permissions.authenticated();
        Permissions.notGuest();
        ids.forEach(function(id) {
            Permissions.check(Clues.findOne(id).canSetCategories([categoryId]));
        });

        Logger.log('Remove category ' + categoryId + ' from: ' + JSON.stringify(ids));

        // Update the clue categories; only remove the category if the clue has the category and it won't leave the clue with no categories
        const updated = Clues.update(
            {
                _id: {$in: ids},
                categories: categoryId,
                'categories.1': {$exists: true},
            },
            {
                $pull: {categories: categoryId}
            },
            {multi: true}
        );

        return updated;

    },

    // Update More Info
    'clue.updateMore'(attrs) {

        check(
            attrs,
            {
                _id: String,
                categoryId: RecordId,
                externalUrl: Match.OneOf(null, String),
                externalId: Match.OneOf(null, String),
                thumbnailUrl: Match.OneOf(null, String),
                imageUrl: Match.OneOf(null, String),
                latitude: Match.OneOf(null, Number),
                longitude: Match.OneOf(null, Number),
                hint: Match.OneOf(null, String),
                moreInfo: Match.OneOf(null, String),
                approximation: Match.OneOf(null, Boolean),
            }
        );
        Permissions.authenticated();
        Permissions.notGuest();
        const clue = Clues.findOne(attrs._id);
        Permissions.check(clue.canEdit(attrs.categoryId));

        Logger.log('Update Clue: ' + attrs._id + ' ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        const updated = Clues.update(
            getClueUpdateSelector(clue, attrs.categoryId),
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
                    approximation: attrs.approximation,
                }
            }
        );
        if (!updated) {
            throw new Meteor.Error('clue-not-updated', 'Could not update a clue.');
        }

        return updated;

    },

    // Delete
    'clue.remove'(id) {

        check(id, RecordId);
        Permissions.authenticated();
        Permissions.notGuest();
        Permissions.owned(Clues.findOne(id));

        Logger.log('Delete Clue: ' + id);

        // Remove the item
        const removed = Clues.remove(
            {
                _id: id,
                ownerId: Meteor.userId(),
            }
        );
        if (!removed) {
            throw new Meteor.Error('clue-not-removed', 'Could not remove a clue.');
        }

        return removed;

    },

    // Activate clues
    'clue.activate'(ids) {

        check(ids, [RecordId]);
        Permissions.authenticated();
        Permissions.notGuest();

        Logger.log('Activate Clues: ' + JSON.stringify(ids));

        // Update only the clues that are owned by user
        const updated = Clues.update(
            {_id: {$in: ids}, ownerId: Meteor.userId()},
            {$set: {active: true}},
            {multi: true}
        );
        if (!updated) {
            throw new Meteor.Error('clues-not-activated', 'Could not activate clues.');
        }

        return updated;

    },

    // Dectivate clues
    'clue.deactivate'(ids) {

        check(ids, [RecordId]);
        Permissions.authenticated();
        Permissions.notGuest();

        Logger.log('Deactivate Clues: ' + JSON.stringify(ids));

        // Update only the clues that are owned by user
        const updated = Clues.update(
            {_id: {$in: ids}, ownerId: Meteor.userId()},
            {$set: {active: false}},
            {multi: true}
        );
        if (!updated) {
            throw new Meteor.Error('clues-not-deactivated', 'Could not deactivate clues.');
        }

        return updated;

    },

    // Open clues
    'clue.open'(ids) {

        check(ids, [RecordId]);
        Permissions.authenticated();
        Permissions.notGuest();

        Logger.log('Open Clues: ' + JSON.stringify(ids));

        // Update only the clues that are owned by user
        const updated = Clues.update(
            {_id: {$in: ids}, ownerId: Meteor.userId()},
            {$set: {open: true}},
            {multi: true}
        );
        if (!updated) {
            throw new Meteor.Error('clues-not-opened', 'Could not open clues.');
        }

        return updated;

    },

    // Lock clues
    'clue.lock'(ids) {

        check(ids, [RecordId]);
        Permissions.authenticated();
        Permissions.notGuest();

        Logger.log('Lock Clues: ' + JSON.stringify(ids));

        // Update only the clues that are owned by user
        const updated = Clues.update(
            {_id: {$in: ids}, ownerId: Meteor.userId()},
            {$set: {open: false}},
            {multi: true}
        );
        if (!updated) {
            throw new Meteor.Error('clues-not-locked', 'Could not lock clues.');
        }

        return updated;

    },

    // Set clue time zones
    'clue.setTimeZone'(ids, timeZone) {

        check(ids, [RecordId]);
        Permissions.authenticated();
        Permissions.notGuest();

        Logger.log('Set Clue Time Zones: ' + JSON.stringify(ids));

        // Update only the clues that are owned by user or are open
        const clues = Clues.find(
            {
                _id: {$in: ids},
                timeZone: {$ne: timeZone},
                $or: [
                    {ownerId: Meteor.userId()},
                    {open: true},
                ]
            },
        );
        let updated = 0;
        clues.forEach(function(clue) {
            const oldDate = moment.utc(clue.date);
            const previousOffset = moment.tz.zone(clue.timeZone).utcOffset(oldDate);
            const newOffset = moment.tz.zone(timeZone).utcOffset(oldDate);
            const offset = newOffset - previousOffset;
            const newDate = oldDate.add(offset, 'minutes');
            const update = Clues.update(clue._id, {$set: {date: newDate.toISOString(), timeZone: timeZone}});
            updated += update;
        });

        if (!updated) {
            throw new Meteor.Error('clues-not-updated', 'Could not update clues.');
        }

        return updated;

    },

});


if (Meteor.isServer) {

    Meteor.methods({

        // Get the full clue data
        'clue.get'(id) {
            const clue = Clues.findOne(id);
            return clue;
        },

        // Calculate the score
        'clue.calculateScore'(clueId) {

            check(clueId, RecordId);

            // Get the sum of all votes
            const votes = Promise.await(
                Votes.rawCollection().aggregate(
                    [
                        {$match: {clueId: clueId}},
                        {$group: {_id: null, score: {$sum: "$value"}}},
                    ]
                ).toArray()
            );
            const score = votes[0].score + Clues.DEFAULT_SCORE;

            const updated = Clues.update(
                {_id: clueId},
                {$set: {score: score}}
            );
            if (!updated) {
                throw new Meteor.Error('clue-not-updated', 'Could not update a clue.');
            }

            return score;

        },

        // Calculate the difficulty
        'clue.calculateDifficulty'(clueId) {

            check(clueId, RecordId);

            // Get the total cards that have used this clue
            const totalCards = Cards.find({clueId: clueId}).count();
            const incorrectCards = Cards.find({clueId: clueId, correct: false}).count();

            // Set the difficulty
            const difficulty = numeral(incorrectCards / totalCards).format('0.00');
            const updated = Clues.update(
                {_id: clueId},
                {$set: {difficulty: difficulty}}
            );
            if (!updated) {
                throw new Meteor.Error('clue-not-updated', 'Could not update a clue.');
            }

            return difficulty;

        },

        // Add a category to clues from shell
        'clue.shellAddCategory'(selector, categoryId) {

            check(selector, Object);
            check(categoryId, RecordId);

            const updated = Clues.update(
                selector,
                {$addToSet: {categories: categoryId}},
                {multi: true}
            );
            if (!updated) {
                throw new Meteor.Error('clue-not-updated', 'Could not add a category to a clue.');
            }

            return updated;

        },

        // Remove a category from clues from shell
        'clue.shellRemoveCategory'(selector, categoryId) {

            check(selector, Object);
            check(categoryId, RecordId);

            const updated = Clues.update(
                selector,
                {$pull: {categories: categoryId}},
                {multi: true}
            );
            if (!updated) {
                throw new Meteor.Error('clue-not-updated', 'Could not remove a category from a clue.');
            }

            return updated;

        },

    });

}

function getClueUpdateSelector(clue, categoryId) {
    let selector = {
        _id: clue._id,
        $or: [
            {ownerId: Meteor.userId()},
        ],
    };
    if (categoryId) {
        const category = Categories.findOne(categoryId);
        if (
            (category.ownerId == Meteor.userId()) ||
            (category.collaborators.includes(Meteor.userId()) && clue.open)
        ) {
            selector.$or.push({categories: categoryId});
        }
    }
    return selector;
}