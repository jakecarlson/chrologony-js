import { AccountsTemplates } from 'meteor/useraccounts:core';
import { Template } from "meteor/templating";

import './o-atError.html';

Template.atError.onCreated(function atErrorOnCreated() {
    this.autorun(() => {

    });
});

Template.atError.helpers({

    hasErrors() {
        const errors = AccountsTemplates.state.form.get("error");
        return (errors && (errors.length > 0));
    },

});