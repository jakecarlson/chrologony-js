import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";

import { Categories } from '../api/categories';
import { ModelEvents } from "../startup/template-events";

import './clue.html';

Template.clue.onCreated(function clueOnCreated() {
    this.state = new ReactiveDict();
    this.state.set('editing', (this.data.clue === false));
});

Template.clue.helpers({

    editing() {
        return Template.instance().state.get('editing');
    },

    viewing() {
        return !Template.instance().state.get('editing');
    },

    id() {
        return this.clue._id;
    },

    description() {
        return this.clue.description;
    },

    date() {
        return moment.utc(this.clue.date).format("YYYY-MM-DD");
    },

    categoryId() {
        return this.clue.categoryId;
    },

    category() {
        return Categories.findOne(this.clue.categoryId);
    },

    hint() {
        return this.clue.hint;
    },

    canEdit() {
        return (
            !this.clue ||
            (this.clue.owner == Meteor.userId()) ||
            (this.clue.categoryId && (Categories.findOne(this.clue.categoryId).owner == Meteor.userId()))
        );
    },

});

Template.clue.events({
    'click .edit': ModelEvents.edit,
    'click .add': ModelEvents.add,
    'click .save': ModelEvents.save,
    'click .cancel': ModelEvents.cancel,
});