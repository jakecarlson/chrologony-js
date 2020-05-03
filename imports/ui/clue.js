import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";

import { Categories } from '../api/categories';
import { ModelEvents } from "../startup/ModelEvents";

import './clue.html';

Template.clue.onCreated(function clueOnCreated() {
    this.state = new ReactiveDict();
    this.state.set('editing', (this.data.clue === false));
    this.state.set('error', false);
});

Template.clue.helpers({

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
        return this.clue._id;
    },

    description() {
        return this.clue.description;
    },

    date() {
        return moment.utc(this.clue.date).format("YYYY-MM-DD");
    },

    categoryId() {
        return this.categoryId;
    },

    hint() {
        return this.clue.hint;
    },

    canEdit() {
        if (!this.clue) {
            return true;
        } else {
            let category = Categories.findOne(this.categoryId);
            return (
                (this.clue.owner == Meteor.userId()) ||
                (category && (category.owner == Meteor.userId()))
            );
        }
    },

});

Template.clue.events({
    'click .edit': ModelEvents.edit,
    'click .add': ModelEvents.add,
    'click .save': ModelEvents.save,
    'click .cancel': ModelEvents.cancel,
});