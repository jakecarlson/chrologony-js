import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import { Clues } from "../api/clues";
import { ModelEvents } from "../startup/ModelEvents";

import './clues_manager.html';
import './clue.js';
import './clues_filter.js';

Template.clues_manager.onCreated(function clues_managerOnCreated() {

    this.state = new ReactiveDict();
    this.state.set('keyword', '');
    this.state.set('owned', false);
    this.state.set('private', false);
    this.state.set('categoryId', false);
    this.state.set('theme', false);

    this.autorun(() => {

        this.subscribe('clues');

        if (this.subscriptionsReady()) {
            Tracker.afterFlush(() => {
                $('#removeClue').on('show.bs.modal', function (event) {
                    let button = $(event.relatedTarget);
                    let id = button.data('id');
                    let modal = $(this)
                    modal.find('.remove').attr('data-id', id);
                });
            });
        }

    });

});

Template.clues_manager.helpers({

    clueCards() {
        
        let selector = {};

        // keyword
        let keyword = Template.instance().state.get('keyword');
        if (keyword.length > 2) {
            selector.$or = [
                {description: {$regex: keyword, $options: 'i'}},
                {date: {$regex: keyword, $options: 'i'}},
                {hint: {$regex: keyword, $options: 'i'}},
            ];
        }

        // owned
        if (Template.instance().state.get('owned')) {
            selector.owner = Meteor.userId();
        }

        // private
        let isPrivate = Template.instance().state.get('private');

        // category
        let categoryId = Template.instance().state.get('categoryId');
        if (categoryId) {
            selector.categoryId = categoryId;
        }

        // theme
        let theme = Template.instance().state.get('theme');
        if (theme) {
            selector.theme = theme;
        }

        console.log('Filter Clues:');
        console.log(selector);

        return Clues.find(selector, {sort:{date:-1}});

    },

});

Template.clues_manager.events({

    'keyup #cluesFilter [name="keyword"]'(e, i) {
        i.state.set('keyword', e.target.value);
    },

    'change #cluesFilter [name="categoryId"]'(e, i) {
        let categoryId = e.target.options[e.target.selectedIndex].value;
        i.state.set('categoryId', categoryId);
    },

    'change #cluesFilter [name="theme"]'(e, i) {
        let theme = e.target.options[e.target.selectedIndex].value;
        i.state.set('theme', theme);
    },

    'change #cluesFilter [name="owned"]'(e, i) {
        i.state.set('owned', e.target.checked);
    },

    'change #cluesFilter [name="private"]'(e, i) {
        i.state.set('private', e.target.checked);
    },

    'click .remove': ModelEvents.remove,

});