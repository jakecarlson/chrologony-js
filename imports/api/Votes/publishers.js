import { Meteor } from 'meteor/meteor';
import { Promise } from "meteor/promise";

import { Cards } from "../Cards";
import { Votes } from "./index";

if (Meteor.isServer) {

    Meteor.publish('votes', function votesPublication(gameId) {
        if (this.userId && gameId) {
            const clueIds = Promise.await(
                Cards.rawCollection().distinct('clueId', {gameId: gameId})
            );
            return Votes.find(
                {
                    clueId: {$in: clueIds},
                    ownerId: Meteor.userId(),
                },
                {
                    fields: Votes.PUBLISH_FIELDS,
                }
            );
        } else {
            return this.ready();
        }
    });

}