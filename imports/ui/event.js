import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { ReactiveDict } from "meteor/reactive-dict";
import { Session } from "meteor/session";
import { Categories } from '../api/categories';
import { ModelEvents } from "../startup/template-event";

import './event.html';

Template.event.onCreated(function eventOnCreated() {
    this.state = new ReactiveDict();
    this.state.set('editing', (this.data.event === false));
});

Template.event.helpers({

    editing() {
        return Template.instance().state.get('editing');
    },

    viewing() {
        return !Template.instance().state.get('editing');
    },

    id() {
        return this.event._id;
    },

    clue() {
        return this.event.clue;
    },

    date() {
        return moment.utc(this.event.date).format("YYYY-MM-DD");
    },

    categoryId() {
        return this.event.categoryId;
    },

    category() {
        return Categories.findOne(this.event.categoryId);
    },

    hint() {
        return this.event.hint;
    },

    matches(val1, val2) {
        return (val1 == val2);
    },

});

Template.event.events({
    'click .edit': ModelEvents.edit,
    'click .add': ModelEvents.add,
    'click .save': ModelEvents.save,
    'click .cancel': ModelEvents.cancel,
    'click .remove': ModelEvents.remove,
});