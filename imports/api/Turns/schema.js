import { Meteor } from "meteor/meteor";
import SimpleSchema from "simpl-schema";
import { Schemas } from "../../modules/Schemas";

import { Turns } from "./index";

Turns.schema = new SimpleSchema({
    gameId: {type: String, regEx: SimpleSchema.RegEx.Id},
    ownerId: {type: String, max: 17},
    currentCardId: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
    lastCardCorrect: {type: Boolean, defaultValue: null, optional: true},
});
Turns.schema.extend(Schemas.timestampable);
Turns.schema.extend(Schemas.endable);
Turns.attachSchema(Turns.schema);

if (Meteor.isServer) {
    Turns.deny({
        insert() { return true; },
        remove() { return true; },
    });
}