import { AccountsTemplates } from 'meteor/useraccounts:core';
import { Template } from "meteor/templating";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";

import './o-atForm.html';
import './o-atError.js';
import './guest.js';

Template.atForm.onCreated(function atFormOnCreated() {
    this.autorun(() => {
        if (AccountsTemplates.getState() == 'verifyEmail') {
            const errors = AccountsTemplates.state.form.get('error');
            if (errors && (errors.length > 0)) {
                Flasher.set(
                    'danger',
                    'Email verification token is invalid or has expired. Try <a href="' + FlowRouter.path('resendVerificationEmail') + '">re-sending the verification email</a>.',
                    false
                );
                FlowRouter.go('home');
            }
        }
    });
});

Template.atForm.onRendered(function atFormOnCreated() {
    Logger.log("Route: " + AccountsTemplates.getState());
});

Template.atForm.helpers({

    size() {
        if (['signIn', 'signUp', 'forgotPwd', 'resetPwd', 'resendVerificationEmail'].includes(AccountsTemplates.getState())) {
            return 'medium';
        }
        return 'small';
    },

    currentRoute() {
        return AccountsTemplates.getState();
    },

    showSignInLink(next_state){
        if (AccountsTemplates.options.hideSignInLink) {
            return false;
        }
        let state = next_state || this.state || AccountsTemplates.getState();
        return (!AccountsTemplates.options.forbidClientAccountCreation && !Meteor.userId() && (state !== "signIn"));
    },

    showSignUpLink(next_state){
        if  (AccountsTemplates.options.hideSignUpLink) {
            return false;
        }
        let state = next_state || this.state || AccountsTemplates.getState();
        return (!AccountsTemplates.options.forbidClientAccountCreation && !Meteor.user() && (state !== "signUp"));
    },

    showGuestLogin() {
        return ['signIn'].includes(AccountsTemplates.getState());
    },

});