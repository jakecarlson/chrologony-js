import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { ModelEvents } from "../../modules/ModelEvents";

import './category.html';
import './themes_selector.js';
import '../precisions_selector.js';
import {FlowRouter} from "meteor/ostrio:flow-router-extra";

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
        if (this.category) {
            let str = this.category.name;
            if (this.category.source != 'user') {
                str += ' [' + this.category.source + ']';
            }
            return str;
        }
        return null;
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

    precision() {
        return (this.category) ? this.category.precision : 'date';
    },

    formattedPrecision() {
        return Formatter.capitalize((this.category) ? this.category.precision : 'date');
    },

    cluesLink() {
        return FlowRouter.path('/clues/:categoryId', {categoryId: this.category._id});
    },

});

Template.category.events({
    'click .edit': ModelEvents.edit,
    'click .add': ModelEvents.add,
    'click .save': ModelEvents.save,
    'click .cancel': ModelEvents.cancel,
    'click .remove': ModelEvents.remove,
});