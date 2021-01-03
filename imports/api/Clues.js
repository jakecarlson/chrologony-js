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
import moment from "moment-timezone";

export const Clues = new Mongo.Collection('clues');

Clues.DEFAULT_SCORE = 10;
Clues.DEFAULT_DIFFICULTY = .5;
Clues.DEFAULT_TIMEZONE = 'UTC';
Clues.PUBLISH_FIELDS = {
    _id: 1,
    description: 1,
    date: 1,
    timeZone: 1,
    active: 1,
    open: 1,
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
};

Clues.schema = new SimpleSchema(
    {
        description: {type: String, max: 240, required: true},
        date: {type: Date, required: true},
        timeZone: {type: String, defaultValue: Clues.DEFAULT_TIMEZONE, required: true},
        active: {type: Boolean, defaultValue: true, required: true},
        open: {type: Boolean, defaultValue: false},
        categories: {type: Array, minCount: 1, required: true},
        'categories.$': {type: String, regEx: SimpleSchema.RegEx.Id},
        hint: {type: String, max: 960, defaultValue: null},
        thumbnailUrl: {type: SimpleSchema.RegEx.Url, max: 960, defaultValue: null},
        imageUrl: {type: SimpleSchema.RegEx.Url, max: 960, defaultValue: null},
        latitude: {type: Number, defaultValue: null},
        longitude: {type: Number, defaultValue: null},
        externalId: {type: String, defaultValue: null},
        externalUrl: {type: SimpleSchema.RegEx.Url, max: 960, defaultValue: null},
        moreInfo: {type: String, max: 3840, defaultValue: null},
        importId: {type: String, defaultValue: null, max: 27},
        importSetId: {type: RecordId, defaultValue: null},
        score: {type: SimpleSchema.Integer, defaultValue: Clues.DEFAULT_SCORE},
        difficulty: {type: Number, defaultValue: Clues.DEFAULT_DIFFICULTY},
        approximation: {type: Boolean, defaultValue: false},
        year: {
            type: Number,
            autoValue: function() {
                const date = this.field('date');
                if (date.isSet) {
                    return date.value.getUTCFullYear();
                }
                return;
            }
        },
        month: {
            type: Number,
            autoValue: function() {
                const date = this.field('date');
                if (date.isSet) {
                    return date.value.getUTCMonth()+1;
                }
                return;
            }
        },
        day: {
            type: Number,
            autoValue: function() {
                const date = this.field('date');
                if (date.isSet) {
                    return date.value.getUTCDate();
                }
                return;
            }
        },
    },
    {
        requiredByDefault: false,
    }
);
Clues.schema.extend(Schemas.timestampable);
Clues.schema.extend(Schemas.ownable());
Clues.attachSchema(Clues.schema);

// Collection hooks
Clues.after.insert(function(id, clue) {
    updateClueCounts(clue.categories);
    Logger.auditCreate('Clues', id, clue);
});
Clues.after.update(function(id, clue) {
    if (!_.isEqual(_.sortBy(clue.categories), _.sortBy(this.previous.categories))) {
        updateClueCounts([...clue.categories, ...this.previous.categories]);
    }
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
        const userCategories = Helpers.getIds(Categories.find(Helpers.getCategoriesSelector({editor: true})));
        const whitelistedCategories = this.categories.concat(userCategories);
        const allowedCategories = categories.filter(function(item) {
            return whitelistedCategories.includes(item);
        });
        return (categories.length == allowedCategories.length);
    },

    hasMoreInfo() {
        return (
            this.moreInfo ||
            this.externalUrl ||
            this.externalId ||
            this.imageUrl ||
            this.thumbnailUrl ||
            (this.latitude && this.longitude)
        );
    },

});

if (Meteor.isServer) {

    Meteor.publish('clues', function cluesPublication(filters, legacy = false) {
        if (this.userId && filters) {

            const selector = getCluePublicationSelector(filters, legacy);
            const limit = filters.page * filters.pageSize;

            Counts.publish(this, 'cluesCount', Clues.find(selector), {noReady: true});

            return Clues.find(
                selector,
                {
                    sort: {date: -1},
                    limit: limit,
                    fields: Clues.PUBLISH_FIELDS,
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
        
        // start date
        let startYear = parseInt(filters.startYear);
        let startMonth = parseInt(filters.startMonth);
        let startDay = parseInt(filters.startDay);
        if (startYear) {
            const startEra = parseInt(filters.startEra);
            if (startEra == -1) {
                startYear = startYear * -1;
            }
        }

        // end date
        let endYear = parseInt(filters.endYear);
        let endMonth = parseInt(filters.endMonth);
        let endDay = parseInt(filters.endDay);
        if (endYear) {
            const endEra = parseInt(filters.endEra);
            if (endEra == -1) {
                endYear = endYear * -1;
            }
        }

        const $and = [];
        if (startYear) {
            const startDate = new Date(Date.UTC(startYear, (startMonth ? startMonth-1 : null), (startDay ? startDay : null), 12));
            $and.push({date: {$gte: startDate}});
        } else if (startMonth || startDay) {
            if (startMonth) {
                $and.push({month: {$gte: startMonth}});
            }
            if (startDay) {
                $and.push({day: {$gte: startDay}});
            }
        }

        if (endYear) {
            const endDate = new Date(Date.UTC(endYear, (endMonth ? endMonth-1 : null), (endDay ? endDay : null), 12));
            $and.push({date: {$lte: endDate}});
        } else if (endMonth || endDay) {
            if (endMonth) {
                $and.push({month: {$lte: endMonth}});
            }
            if (endDay) {
                $and.push({day: {$lte: endDay}});
            }
        }

        if ($and.length > 0) {
            selector.$and = $and;
        }

    }

    return selector;

}

function updateClueCounts(categoryIds) {
    Meteor.call('category.updateClueCounts', categoryIds, function(err, updated) {
        if (!err) {
            Logger.log("Updated Category Clue Counts: " + updated);
        } else {
            throw new Meteor.Error('category-clues-not-set', 'Could not update the category clue counts.', err);
        }
    });
}