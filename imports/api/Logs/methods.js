import { Meteor } from "meteor/meteor";
import { Permissions } from "../../modules/Permissions";
import { Logs } from "./index";

if (Meteor.isServer) {

    Meteor.methods({

        // Log an action
        'log'(attrs) {
            Permissions.authenticated();
            attrs.userId = Meteor.userId();
            Logs.insert(attrs);
            return true;
        },

    });

}