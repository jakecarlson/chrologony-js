import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { Promise } from "meteor/promise";
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';
import SimpleSchema from "simpl-schema";
import { Schemas } from "../modules/Schemas";

import { Categories } from "./Categories";
import { Cards } from "./Cards";
import { Votes } from "./Votes";

export const Clues = new Mongo.Collection('clues');

Clues.DEFAULT_SCORE = 10;
Clues.DEFAULT_DIFFICULTY = .5;

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
        score: {type: SimpleSchema.Integer, defaultValue: Clues.DEFAULT_SCORE},
        difficulty: {type: Number, defaultValue: Clues.DEFAULT_DIFFICULTY},
        approximation: {type: Boolean, defaultValue: false},
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

    vote() {
        return Votes.findOne({clueId: this._id, ownerId: Meteor.userId()});
    },

    canEdit(categoryId) {
        return Permissions.clue.canEdit(this, categoryId);
    },

    canSetCategories(categories) {
        const userCategories = Helpers.getIds(Categories.find(Helpers.getCategoriesSelector({private: null, user: true})));
        const whitelistedCategories = this.categories.concat(userCategories);
        const allowedCategories = categories.filter(function(item) {
            return whitelistedCategories.includes(item);
        });
        return (categories.length == allowedCategories.length);
    },

});

if (Meteor.isServer) {

    Meteor.publish('clues', function cluesPublication(filters, advancedSearch = false) {
        if (this.userId && filters) {

            const selector = getCluePublicationSelector(filters, advancedSearch);
            const limit = filters.page * filters.pageSize;

            Counts.publish(this, 'cluesCount', Clues.find(selector));

            return Clues.find(
                selector,
                {
                    sort: {date: -1},
                    limit: limit,
                    fields: {
                        _id: 1,
                        description: 1,
                        date: 1,
                        active: 1,
                        categories: 1,
                        ownerId: 1,
                        score: 1,
                        difficulty: 1,
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
        const category = Categories.findOne(attrs.categoryId);
        Permissions.check((category && category.canAddClue()));

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
                active: Boolean,
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
                    active: attrs.active,
                }
            }
        );

    },

    // Set Categories
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

    // Add Category
    'clue.addCategory'(ids, categoryId) {

        check(ids, [RecordId]);
        check(categoryId, RecordId);
        Permissions.check(Permissions.authenticated());
        ids.forEach(function(id) {
            Permissions.check(Clues.findOne(id).canSetCategories([categoryId]));
        });

        Logger.log('Add category ' + categoryId + ' to: ' + JSON.stringify(ids));

        // Update the clue categories
        return Clues.update(
            {
                _id: {$in: ids},
            },
            {
                $push: {categories: categoryId}
            },
            {multi: true}
        );

    },

    // Remove Category
    'clue.removeCategory'(ids, categoryId) {

        check(ids, [RecordId]);
        check(categoryId, RecordId);
        Permissions.check(Permissions.authenticated());
        ids.forEach(function(id) {
            Permissions.check(Clues.findOne(id).canSetCategories([categoryId]));
        });

        Logger.log('Remove category ' + categoryId + ' from: ' + JSON.stringify(ids));

        // Update the clue categories
        return Clues.update(
            {
                _id: {$in: ids},
            },
            {
                $pull: {categories: categoryId}
            },
            {multi: true}
        );

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
                        {$group: {_id: null, sum: {$sum: "$value"}}},
                        {$project: {_id: 0, sum: 1}},
                    ]
                ).toArray()
            );
            const score = votes[0].sum;

            const updated = Clues.update(
                {_id: clueId},
                {$set: {score: score}}
            );
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
            return difficulty;

        },

        // Add a category to clues from shell
        'clue.shellAddCategory'(selector, categoryId) {

            check(selector, Object);
            check(categoryId, RecordId);

            return Clues.update(
                selector,
                {$push: {categories: categoryId}},
                {multi: true}
            );

        },

        // Remove a category from clues from shell
        'clue.shellRemoveCategory'(selector, categoryId) {

            check(selector, Object);
            check(categoryId, RecordId);

            return Clues.update(
                selector,
                {$pull: {categories: categoryId}},
                {multi: true}
            );

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

function getCluePublicationSelector(filters, advancedSearch = false) {

    let selector = {};

    // If predefined clue, use only that
    if (filters.clueId) {
        selector._id = filters.clueId;

    } else {

        // category
        selector.categories = filters.categoryId;

        // owned
        if (filters.owned) {
            selector.ownerId = Meteor.userId();
        }

        // keyword
        if (filters.keyword && (filters.keyword.length > 2)) {

            // If using text search, we need to pre-filter before doing the full text search
            if (advancedSearch) {
                selector.$text = {$search: filters.keyword};

            // Otherwise use straight-up regex
            } else {
                selector.$or = [
                    {description: {$regex: filters.keyword, $options: 'i'}},
                    {date: {$regex: filters.keyword, $options: 'i'}},
                    {moreInfo: {$regex: filters.keyword, $options: 'i'}},
                    {hint: {$regex: filters.keyword, $options: 'i'}},
                ];
            }

        }

    }

    return selector;
}