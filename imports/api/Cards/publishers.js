import { Meteor } from 'meteor/meteor';
import { publishComposite } from 'meteor/reywood:publish-composite';
import { Promise } from "meteor/promise";

import { Games } from "../Games";
import { Clues } from "../Clues";
import { Cards } from "./index";

if (Meteor.isServer) {

    Meteor.publish('cards', function cardsPublication(gameId) {
        if (this.userId && gameId) {
            return Cards.find(
                {
                    gameId: gameId
                },
                {
                    fields: {
                        _id: 1,
                        gameId: 1,
                        turnId: 1,
                        clueId: 1,
                        correct: 1,
                        lockedAt: 1,
                        pos: 1,
                        ownerId: 1,
                        createdAt: 1,
                    }
                }
            );
        } else {
            return this.ready();
        }
    });

    publishComposite('cardClues', function(gameId) {
        return {
            find() {
                if (this.userId && gameId) {
                    const clueIds = Promise.await(
                        Cards.rawCollection().distinct('clueId', {gameId: gameId})
                    );
                    const unsubmittedClueIds = Promise.await(
                        Cards.rawCollection().distinct('clueId', {gameId: gameId, correct: null})
                    );
                    const game = Games.findOne(gameId);
                    return Clues.find(
                        {
                            _id: {$in: clueIds},
                        },
                        {
                            fields: {
                                _id: 1,
                                date: 1,
                                description: 1,
                                categories: 1,
                                hint: 1,
                                score: 1,
                                difficulty: 1,
                                thumbnailUrl: 1,
                                imageUrl: 1,
                                latitude: 1,
                                longitude: 1,
                                externalId: 1,
                                externalUrl: 1,
                                moreInfo: 1,
                                approximation: 1,
                            },
                            transform: function(doc) {
                                if (unsubmittedClueIds.includes(doc._id)) {
                                    doc.date = null;
                                    if (!game.showHints) {
                                        doc.hint = null;
                                    }
                                    doc.thumbnailUrl = null;
                                    doc.imageUrl = null;
                                    doc.latitude = null;
                                    doc.longitude = null;
                                    doc.externalId = null;
                                    doc.externalUrl = null;
                                    doc.moreInfo = null;
                                    doc.approximation = null;
                                }
                                return doc;
                            },
                        }
                    );
                } else {
                    return this.ready();
                }
            }
        };
    });

}