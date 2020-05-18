import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";

import { ModelEvents } from "../../modules/ModelEvents";

import './category.html';
import './themes_selector.js';

Template.category.onCreated(function categoryOnCreated() {
    this.state = new ReactiveDict();
    this.state.set('editing', (this.data.category === false));
    this.state.set('error', false);
});

Template.category.onRendered(function categoryOnRendered() {
    this.$('[data-toggle="toggle"]').bootstrapToggle();
});

Template.category.helpers({

    editing() {
        return Template.instance().state.get('editing');
    },

    error() {
        return Template.instance().state.get('error');
    },

    viewing() {
        return !Template.instance().state.get('editing');
    },

    id() {
        return this.category._id;
    },

    name() {
        return this.category.name;
    },

    private() {
        return this.category.private;
    },

    active() {
        return this.category.active;
    },

    theme() {
        return this.category.theme;
    },

    categoryThemes() {
        return Meteor.settings.public.themes;
    },

});

Template.category.events({
    'click .edit': ModelEvents.edit,
    'click .add': ModelEvents.add,
    'click .save': ModelEvents.save,
    'click .cancel': ModelEvents.cancel,
    'click .remove': ModelEvents.remove,
});