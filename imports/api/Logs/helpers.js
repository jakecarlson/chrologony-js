import { Meteor } from "meteor/meteor";
import { Logs } from "./index";

Logs.helpers({

    user() {
        return Meteor.users.findOne(this.userId);
    },

    document() {
        return global[this.collection].findOne(this.documentId);
    },

});