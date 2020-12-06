import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { Promise } from "meteor/promise";
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';
import SimpleSchema from "simpl-schema";
import { Schemas } from "../modules/Schemas";

import { Categories } from "./Categories";
import { Games } from "./Games";
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

// Collection hooks
Clues.after.insert(function(id, clue) {
    updateClueCounts(clue.categories);
    Logger.auditCreate('Clues', id, clue);
});
Clues.after.update(function(id, clue) {
    updateClueCounts([...clue.categories, ...this.previous.categories]);
    Logger.auditUpdate('Clues', id, this.previous, clue, ['difficulty', 'score']);
});
Clues.after.remove(function(id, clue) {
    updateClueCounts(clue.categories);
    Logger.auditDelete('Clues', id);
});

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

    dateObj(precision) {
        if (this.date) {
            const dateObj = moment.utc(this.date);
            if (precision) {
                const precisionIndex = Games.PRECISION_OPTIONS.indexOf(precision);
                const second = (precisionIndex <= 0) ? dateObj.get('second') : 0;
                const minute = (precisionIndex <= 1) ? dateObj.get('minute') : 0;
                const hour = (precisionIndex <= 2) ? dateObj.get('hour') : 0;
                const date = (precisionIndex <= 3) ? dateObj.get('date') : 1;
                const month = (precisionIndex <= 4) ? dateObj.get('month') : 0;
                let year = dateObj.get('year');
                if (precisionIndex > 5) {
                    let factor = Math.pow(10, precisionIndex - 5);
                    year = (Math.floor(year / factor) * factor)
                }
                const jsDate = new Date(Date.UTC(year, month, date, hour, minute, second));
                jsDate.setUTCFullYear(year);
                return moment.utc(jsDate);
            } else {
                return dateObj;
            }
        }
        return null;
    },

    formattedDate(precision) {
        let str = '';
        if (this.date) {
            if (this.approximation) {
                str += 'c. ';
            }
            if (Helpers.isTimePrecision(precision)) {
                precision = 'date';
            }
            str += Formatter[precision](this.dateObj());
        }
        return str;
    },

    shortDate(precision) {
        if (this.date) {
            if (!Helpers.isYearPrecision(precision)) {
                precision = 'year';
            }
            return Formatter[precision](this.dateObj(), true);
        }
        return null;
    },

    formattedTime(precision) {
        let str = null;
        if (this.date && Helpers.isTimePrecision(precision)) {
            str = Formatter[precision](this.dateObj());
        }
        return str;
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

    Meteor.publish('clues', function cluesPublication(filters, legacy = false) {
        if (this.userId && filters) {

            const selector = getCluePublicationSelector(filters, legacy);
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
                        approximation: 1,
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
        Permissions.authenticated();
        Permissions.notGuest();
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
        Permissions.authenticated();
        Permissions.notGuest();
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
        Permissions.authenticated();
        Permissions.notGuest();
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
        Permissions.authenticated();
        Permissions.notGuest();
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
        Permissions.authenticated();
        Permissions.notGuest();
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
                approximation: Match.OneOf(null, Boolean),
            }
        );
        Permissions.authenticated();
        Permissions.notGuest();
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
                    approximation: attrs.approximation,
                }
            }
        );

    },

    // Delete
    'clue.remove'(id) {

        check(id, RecordId);
        Permissions.authenticated();
        Permissions.notGuest();
        Permissions.owned(Clues.findOne(id));

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

function getCluePublicationSelector(filters, legacy = false) {

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

            // Use straight-up regex if basic search is enabled
            if (legacy) {
                selector.$or = [
                    {description: {$regex: filters.keyword, $options: 'i'}},
                    {date: {$regex: filters.keyword, $options: 'i'}},
                    {moreInfo: {$regex: filters.keyword, $options: 'i'}},
                    {hint: {$regex: filters.keyword, $options: 'i'}},
                ];

            // Otherwise we'll use text search
            } else {
                selector.$text = {$search: filters.keyword};
            }

        }

    }

    return selector;

}

function updateClueCounts(categoryIds) {
    Meteor.call('category.updateClueCounts', categoryIds, function(err, updated) {
        if (!err) {
            Logger.log("Updated Category Clue Counts: " + updated);
        }
    });
}