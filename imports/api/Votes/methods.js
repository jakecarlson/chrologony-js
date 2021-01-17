import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { RecordId } from "../../startup/validations";
import { Permissions } from '../../modules/Permissions';

import { Votes } from "./index";

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