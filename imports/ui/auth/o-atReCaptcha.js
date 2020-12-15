import './o-atReCaptcha.html';

Template.atReCaptcha.onRendered(function atReCaptchaOnRendered() {
    $.getScript('https://www.google.com/recaptcha/api.js?hl=' + T9n.getLanguage());
});