import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { LoadingState } from "../modules/LoadingState";

import './layout_unauthenticated.html';
import './footer.js';
import './flasher.js';

import './auth/o-atError.html';
import './auth/o-atForm.js';
import './auth/o-atMessage.html';
import './auth/o-atOauth.html';
import './auth/o-atPwdForm.html';
import './auth/o-atPwdFormBtn.html';
import './auth/o-atPwdLink.html';
import './auth/o-atReCaptcha.html';
import './auth/o-atResendVerificationEmailLink.html';
import './auth/o-atResult.html';
import './auth/o-atSep.html';
import './auth/o-atSigninLink.html';
import './auth/o-atSignupLink.html';
import './auth/o-atSocial.html';
import './auth/o-atTermsLink.html';
import './auth/o-atTitle.html';
import './auth/o-inputs.html';
import {Meteor} from "meteor/meteor";

Template['o-atError'].replaces('atError');
Template['o-atForm'].replaces('atForm');
Template['o-atMessage'].replaces('atMessage');
Template['o-atOauth'].replaces('atOauth');
Template['o-atPwdForm'].replaces('atPwdForm');
Template['o-atPwdFormBtn'].replaces('atPwdFormBtn');
Template['o-atPwdLink'].replaces('atPwdLink');
Template['o-atReCaptcha'].replaces('atReCaptcha');
Template['o-atResendVerificationEmailLink'].replaces('atResendVerificationEmailLink');
Template['o-atResult'].replaces('atResult');
Template['o-atSep'].replaces('atSep');
Template['o-atSigninLink'].replaces('atSigninLink');
Template['o-atSignupLink'].replaces('atSignupLink');
Template['o-atSocial'].replaces('atSocial');
Template['o-atTermsLink'].replaces('atTermsLink');
Template['o-atTitle'].replaces('atTitle');
Template['o-atInput'].replaces('atInput');
Template['o-atTextInput'].replaces('atTextInput');
Template['o-atCheckboxInput'].replaces('atCheckboxInput');
Template['o-atSelectInput'].replaces('atSelectInput');
Template['o-atRadioInput'].replaces('atRadioInput');
Template['o-atHiddenInput'].replaces('atHiddenInput');

Template.layout_unauthenticated.onRendered(function layout_unauthenticatedOnCreated() {
    if (Meteor.userId()) {
        FlowRouter.go('lobby');
    }
    LoadingState.stop();
});

Template.layout_unauthenticated.helpers({
    homeLink() {
        return FlowRouter.path('home');
    },
});