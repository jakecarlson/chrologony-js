import { Meteor } from "meteor/meteor";
import { RecordId } from "../../startup/validations";
import SimpleSchema from "simpl-schema";
import { Schemas } from "../../modules/Schemas";

import { Clues } from "./index";

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

function updateClueCounts(categoryIds) {
    Meteor.call('category.updateClueCounts', categoryIds, function(err, updated) {
        if (!err) {
            Logger.log("Updated Category Clue Counts: " + updated);
        } else {
            throw new Meteor.Error('category-clues-not-set', 'Could not update the category clue counts.', err);
        }
    });
}