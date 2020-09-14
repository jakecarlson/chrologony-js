import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './themes_selector.html';

Template.themes_selector.onCreated(function themes_selectorOnCreated() {

});

Template.themes_selector.helpers({
    themes() {
        return Meteor.settings.public.themes;
    },
});

Template.themes_selector.events({

});