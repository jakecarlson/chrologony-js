import { AccountsTemplates } from 'meteor/useraccounts:core';
import { Template } from "meteor/templating";
import { LoadingState } from "../../modules/LoadingState";

import './o-atError.html';

Template.atError.onCreated(function atErrorOnCreated() {
    this.autorun(() => {

    });
});

Template.atError.helpers({

    hasErrors() {
        const errors = AccountsTemplates.state.form.get("error");
        const hasErrors = (errors && (errors.length > 0));
        if (hasErrors) {
            LoadingState.stop();
        }
        return hasErrors;
    },

});