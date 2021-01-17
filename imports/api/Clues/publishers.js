import { Meteor } from 'meteor/meteor';
import { Clues } from "./index";

if (Meteor.isServer) {

    Meteor.publish('clues', function cluesPublication(filters, legacy = false) {
        if (this.userId && filters) {

            const selector = getCluePublicationSelector(filters, legacy);
            const limit = filters.page * filters.pageSize;

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

    Meteor.publish('cluesCount', function cluesPublication(filters, legacy = false) {
        if (this.userId && filters) {
            return new Counter('cluesCount', Clues.find(getCluePublicationSelector(filters, legacy)));
        } else {
            return this.ready();
        }

    });

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


