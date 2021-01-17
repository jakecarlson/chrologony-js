import { Meteor } from 'meteor/meteor';
import { publishComposite } from 'meteor/reywood:publish-composite';

import { Games } from "./index";

if (Meteor.isServer) {

    publishComposite('games', function(additionalGameIds) {
        return {

            find() {
                if (this.userId) {

                    let selector = {
                        deletedAt: null,
                        $or: [
                            {players: this.userId, endedAt: null},
                            {
                                private: false,
                                'players.0': {$exists: true},
                                endedAt: null,
                                $and: [
                                    {$or: [
                                            {noJoinAfterStart: false},
                                            {startedAt: null},
                                        ]},
                                    {$or: [
                                            {playerLimit: 0},
                                            {$expr:{$lt:[{$size:"$players"}, "$playerLimit"]}},
                                        ]},
                                ],
                            },
                        ],
                    };
                    if (additionalGameIds) {
                        selector.$or.push({_id: {$in: additionalGameIds}});
                    }

                    return Games.find(
                        selector,
                        {
                            fields: Games.PUBLISH_FIELDS,
                            sort: {
                                // name: 1,
                                createdAt: -1,
                            },
                            limit: 100,
                            transform: function(doc) {
                                if (additionalGameIds && additionalGameIds.includes(doc._id)) {
                                    doc.token = Hasher.md5.hash(doc._id);
                                }
                                doc.password = (doc.password ? true : false);
                                return doc;
                            },
                        }
                    );

                } else {
                    return this.ready();
                }
            },

        }

    });

    Meteor.publish('anonymousGame', function anonymousGamePublication(id) {
        if (this.userId && id) {
            return Games.find(
                {
                    _id: id
                },
                {
                    fields: Games.PUBLISH_FIELDS,
                }
            );
        } else {
            return this.ready();
        }
    });

}