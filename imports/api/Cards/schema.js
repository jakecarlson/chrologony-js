import { Meteor } from "meteor/meteor";
import SimpleSchema from 'simpl-schema';
import { Schemas } from '../../modules/Schemas';

import { Cards } from "./index";

Cards.schema = new SimpleSchema({
    gameId: {type: String, regEx: SimpleSchema.RegEx.Id},
    turnId: {type: String, regEx: SimpleSchema.RegEx.Id},
    clueId: {type: String, regEx: SimpleSchema.RegEx.Id},
    ownerId: {type: String, max: 17},
    correct: {type: Boolean, defaultValue: null, optional: true},
    guessedAt: {type: Date, defaultValue: null, optional: true},
    lockedAt: {type: Date, defaultValue: null, optional: true},
    pos: {type: SimpleSchema.Integer, defaultValue: 0},
});
Cards.schema.extend(Schemas.timestampable);
Cards.attachSchema(Cards.schema);

if (Meteor.isServer) {
    Cards.deny({
        insert() { return true; },
        update() { return true; },
        remove() { return true; },
    });
}