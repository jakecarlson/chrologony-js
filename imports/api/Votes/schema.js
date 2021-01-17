import { Meteor } from "meteor/meteor";
import SimpleSchema from 'simpl-schema';
import { Schemas } from '../../modules/Schemas';

import { Votes } from "./index";

Votes.schema = new SimpleSchema({
    clueId: {type: String, regEx: SimpleSchema.RegEx.Id},
    value: {type: SimpleSchema.Integer, defaultValue: 0},
});
Votes.schema.extend(Schemas.timestampable);
Votes.schema.extend(Schemas.ownable());
Votes.attachSchema(Votes.schema);

if (Meteor.isServer) {
    Votes.deny({
        insert() { return true; },
        update() { return true; },
        remove() { return true; },
    });
}