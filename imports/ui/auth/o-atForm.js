import { AccountsTemplates } from 'meteor/useraccounts:core';
import { Template } from "meteor/templating";

import './o-atForm.html';

Template.atForm.onRendered(function atFormOnCreated() {
    Logger.log("Route: " + AccountsTemplates.getState());
});

Template.atForm.helpers({

    currentRoute() {
        return AccountsTemplates.getState();
    },

});