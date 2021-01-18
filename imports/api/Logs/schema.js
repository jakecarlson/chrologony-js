import { Meteor } from "meteor/meteor";
import SimpleSchema from "simpl-schema";
import { Logs } from "./index";

Logs.schema = new SimpleSchema({
    action: {type: String, max: 24, required: true},
    userId: {type: String, max: 17, required: true},
    collection: {type: String, max: 24, defaultValue: null, optional: true},
    documentId: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
    previousAttrs: {type: Object, defaultValue: null, optional: true, blackbox: true},
    attrs: {type: Object, defaultValue: null, optional: true, blackbox: true},
    loggedAt: {
        type: Date,
        autoValue() {
            return new Date();
        },
        required: true,
    },
});
Logs.attachSchema(Logs.schema);

if (Meteor.isServer) {
    Logs.deny({
        insert() { return true; },
        update() { return true; },
        remove() { return true; },
    });
}