import '../imports/ui/body.js';
import '../imports/startup/accounts-config.js';
import '../imports/startup/template-helpers.js';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap4-toggle';
import 'bootstrap4-toggle/css/bootstrap4-toggle.min.css';

Meteor.startup(function() {
    reCAPTCHA.config({
        publickey: Meteor.settings.public.recaptcha.key,
        hl: 'en',
    });
});