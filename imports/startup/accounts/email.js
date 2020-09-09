import { Accounts } from "meteor/accounts-base";
import { SSR, Template } from 'meteor/meteorhacks:ssr';

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

function getUrl(template, url) {
    if (template.url) {
        return template.url;
    } else if (url) {
        return url;
    } else {
        return '';
    }
}

Accounts.emailTemplates.siteName = Meteor.settings.public.app.name;
Accounts.emailTemplates.from = Meteor.settings.public.app.name + ' <' + Meteor.settings.public.app.email + '>';

const emails = {

    enroll_account: {
        subject: 'Welcome to ' + Meteor.settings.public.app.name,
        preview: 'You have created a ' + Meteor.settings.public.app.name + ' account.',
        url: Meteor.absoluteUrl('/lobby#tour'),
    },

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