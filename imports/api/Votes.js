import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';
import SimpleSchema from 'simpl-schema';
import { Promise } from "meteor/promise";
import { Schemas } from '../modules/Schemas';

import { Clues } from "./Clues";
import { Cards } from "./Cards";

export const Votes = new Mongo.Collection('votes');

Votes.schema = new SimpleSchema({
    clueId: {type: String, regEx: SimpleSchema.RegEx.Id},
    value: {type: SimpleSchema.Integer, defaultValue: 0},
});
Votes.schema.extend(Schemas.timestampable);
Votes.schema.extend(Schemas.ownable());
Votes.attachSchema(Votes.schema);

Votes.helpers({

    clue() {
        return Clues.findOne(this.clueId);
    },

    owner() {
        return Meteor.users.findOne(this.ownerId);
    },

});

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
                    fields: {
                        _id: 1,
                        clueId: 1,
                        ownerId: 1,
                        value: 1,
                    }
                }
            );
        } else {
            return this.ready();
        }
    });

    Votes.deny({
        insert() { return true; },
        update() { return true; },
        remove() { return true; },
    });

}

Meteor.methods({

    // Set the clue vote
    'vote.set'(clueId, value) {

        check(clueId, RecordId);
        check(value, Match.Integer);
        Permissions.authenticated();
        Permissions.notGuest();

        Logger.log("Set Vote for " + clueId + ": " + value);

        const updated = Votes.update(
            {
                clueId: clueId,
                ownerId: Meteor.userId()
            },
            {
                $set: {value: value}
            }
        );
        if (!updated) {
            try {

                Votes.insert({
                    ownerId: Meteor.userId(),
                    clueId: clueId,
                    value: value,
                });

                Meteor.call('clue.calculateScore', clueId, function(err, score) {
                    if (!err) {
                        Logger.log("Updated Clue Score: " + clueId);
                    } else {
                        throw new Meteor.Error('clue-score-not-calculated', 'Could not calculate a clue score.', err);
                    }
                });

                return true;

            } catch(err) {
                throw new Meteor.Error('vote-not-inserted', 'Could not create a vote.', err);
            }
        }

    },

});