import { Template } from 'meteor/templating';
import {ReactiveDict} from "meteor/reactive-dict";

import './category.html';
import { ModelEvents } from "../startup/template-event";

Template.category.onCreated(function categoryOnCreated() {
    this.state = new ReactiveDict();
    this.state.set('editing', (this.data.category === false));
});

Template.category.onRendered(function categoryOnRendered() {
    this.$('[data-toggle]').bootstrapToggle();
});

Template.category.helpers({

    editing() {
        return Template.instance().state.get('editing');
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

});

Template.category.events({
    'click .edit': ModelEvents.edit,
    'click .add': ModelEvents.add,
    'click .save': ModelEvents.save,
    'click .cancel': ModelEvents.cancel,
    'click .remove': ModelEvents.remove,
});