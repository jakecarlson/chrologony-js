import { Meteor } from 'meteor/meteor';
import { Turns } from "./index";

if (Meteor.isServer) {

    Meteor.publish('turns', function turnPublication(gameId) {
        if (this.userId) {
            let selector = {};
            if (gameId) {
                selector.$or = [
                    {gameId: gameId},
                    {ownerId: this.userId, endedAt: null},
                ];
            } else {
                selector.gameId = gameId;
            }
            return Turns.find(
                selector,
                {
                    fields: Turns.PUBLISH_FIELDS,
                    sort: {
                        createdAt: -1,
                    },
                    limit: 2,
                }
            );
        } else {
            return this.ready();
        }
    });

}