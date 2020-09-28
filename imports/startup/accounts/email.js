import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import { AccountsTemplates } from 'meteor/useraccounts:core';
import { SSR, Template } from 'meteor/meteorhacks:ssr';

// Set sender info
Accounts.emailTemplates.siteName = Meteor.settings.public.app.name;
Accounts.emailTemplates.from = Meteor.settings.public.app.sendEmail;

// Set the password reset URL
Accounts.urls.resetPassword = function(token) {
    return Meteor.absoluteUrl('reset-password/' + token);
};

// Set the verify email URL
Accounts.urls.verifyEmail = function(token) {
    return Meteor.absoluteUrl('verify-email/' + token);
};

AccountsTemplates.configure({
    postSignUpHook(userId, info) {
        Accounts.sendVerificationEmail(userId);
    },
});

Accounts.validateLoginAttempt(function(params) {

    // Only validate verified email for password logins
    if (params.type == 'password') {
        const newSignup = (params.user && params.user.profile && !params.user.profile.name);
        if (!newSignup && params.user && params.user.emails && (params.user.emails.length > 0)) {
            let found = _.find(
                params.user.emails,
                function(thisEmail) { return thisEmail.verified }
            );
            if (!found) {
                throw new Meteor.Error(403, "Please verify your email by clicking on the link that was sent to you via email.");
            }
            return found && params.allowed;
        }
    }

    // Fallback to allowed
    return params.allowed;

});

const emails = {

    reset_password: {
        subject: 'Reset Your Password',
        preview: 'Please click the link to reset your password.',
    },

    verify_email: {
        subject: 'Verify Your Email Address',
        preview: 'Please verify your email address.',
    },

};

SSR.compileTemplate('layout_email', Assets.getText('email/layout_email.html'));
Template.layout_email.helpers({
    doctype() { return "<!DOCTYPE html>"; }
});

for (const [template, data] of Object.entries(emails)) {
    let templateCamel = Helpers.snakeToCamel(template);
    SSR.compileTemplate(template, Assets.getText('email/' + template + '.html'));
    Accounts.emailTemplates[templateCamel] = {
        subject() { return data.subject; },
        text(user, url) {
            return Helpers.stripHtml(SSR.render(template, {user: user, url: url}));
        },
        html(user, url) {
            const email = Helpers.renderHtmlEmail({
                subject: data.subject,
                preview: data.preview,
                template: template,
                data: {user: user, url: url}
            });
            return email.html;
        },
    };
}