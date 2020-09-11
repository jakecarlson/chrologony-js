import { Accounts } from "meteor/accounts-base";
import { AccountsTemplates } from 'meteor/useraccounts:core';
import { SSR, Template } from 'meteor/meteorhacks:ssr';
import {Meteor} from "meteor/meteor";

// Set sender info
Accounts.emailTemplates.siteName = Meteor.settings.public.app.name;
Accounts.emailTemplates.from = Meteor.settings.public.app.name + ' <' + Meteor.settings.public.app.email + '>';

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

Accounts.validateLoginAttempt(function(parameters) {
    if (parameters.user && parameters.user.emails && (parameters.user.emails.length > 0)) {
        let found = _.find(
            parameters.user.emails,
            function(thisEmail) { return thisEmail.verified }
        );
        if (!found) {
            throw new Meteor.Error(403, "Please verify your email prior to logging in.");
        }
        return found && parameters.allowed;
    } else {
        return parameters.allowed;
    }
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
    let templateCamel = snakeToCamel(template);
    SSR.compileTemplate(template, Assets.getText('email/' + template + '.html'));
    Accounts.emailTemplates[templateCamel] = {
        subject() { return data.subject; },
        text(user, url) {
            return stripHtml(SSR.render(template, {user: user, url: url}));
        },
        html(user, url) {
            return SSR.render(
                'layout_email',
                {
                    subject: data.subject,
                    preview: data.preview,
                    message: SSR.render(template, {user: user, url: url, app_name: Meteor.settings.public.app.name}),
                    app_name: Meteor.settings.public.app.name,
                    app_url: Meteor.absoluteUrl(),
                    logo_url: Meteor.absoluteUrl('/logo.png'),
                }
            );
        },
    };
}

function stripHtml(str) {
    return str.replace(/(<([^>]+)>)/gi, "");
}

function snakeToCamel(str) {
    return str.replace(
        /([-_][a-z])/g,
        (group) => group.toUpperCase()
            .replace('-', '')
            .replace('_', '')
    );
}