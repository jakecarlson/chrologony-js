import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";

import { Categories } from '../../api/Categories';
import { ModelEvents } from "../../modules/ModelEvents";

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
        return Formatter.date(this.clue.date);
    },

    categoryId() {
        return this.categoryId;
    },

    hint() {
        return this.clue.hint;
    },

    newClue() {
        return !this.clue;
    },

    canEdit() {
        if (this.clue && (this.clue.ownerId == Meteor.userId())) {
            return true;
        }
        const category = Categories.findOne(this.categoryId);
        if (category && (category.ownerId == Meteor.userId())) {
            return true;
        }
        return false;
    },

});

Template.clue.events({
    'click .edit': ModelEvents.edit,
    'click .add': ModelEvents.add,
    'click .save': ModelEvents.save,
    'click .cancel': ModelEvents.cancel,
});