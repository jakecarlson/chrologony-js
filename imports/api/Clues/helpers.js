import { Meteor } from 'meteor/meteor';
import moment from "moment-timezone";
import { Permissions } from '../../modules/Permissions';

import { Categories } from '../Categories';
import { Games } from '../Games';
import { Votes } from '../Votes';
import { Clues } from './index';

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