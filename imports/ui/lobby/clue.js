import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { Permissions } from "../../modules/Permissions";
import { ModelEvents } from "../../modules/ModelEvents";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";

import './clue.html';

Template.clue.onCreated(function clueOnCreated() {

    this.state = new ReactiveDict();
    this.state.set('editing', (this.data.clue === false));
    this.state.set('error', false);
    this.state.set('selected', false);

    const clueId = FlowRouter.getParam('clueId');
    if (clueId && (clueId == this.data.clue._id)) {
        this.state.set('editing', true);
    }

});

Template.clue.onRendered(function clueOnRendered() {
    this.$('[data-toggle="toggle"]').bootstrapToggle();
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

    selected() {
        return Template.instance().state.get('selected');
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

    active() {
        return this.clue.active;
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
        if (!this.clue) {
            return true;
        }
        return this.clue.canEdit(this.categoryId);
    },

    canRemove() {
        return Permissions.owned(this.clue);
    },

});

Template.clue.events({

    'click .edit': ModelEvents.edit,
    'click .add': ModelEvents.add,
    'click .save': ModelEvents.save,
    'click .cancel': ModelEvents.cancel,

    'change [name="id"]'(e, i) {
        i.state.set('selected', e.target.checked);
    },

});