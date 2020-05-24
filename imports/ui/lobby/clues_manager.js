import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { ModelEvents } from "../../modules/ModelEvents";
import { LoadingState } from "../../modules/LoadingState";

import { Categories } from "../../api/Categories";
import { Clues } from "../../api/Clues";

import './clues_manager.html';
import './clue.js';
import './clues_filter.js';

Template.clues_manager.onCreated(function clues_managerOnCreated() {

    this.state = new ReactiveDict();
    this.state.set('keyword', '');
    this.state.set('owned', false);
    this.state.set('categoryId', null);
    this.state.set('numResults', 0);
    this.state.set('currentClue', null);
    this.state.set('categories', []);

    this.autorun(() => {

        LoadingState.start();

        FlowRouter.watchPathChange();

        this.state.set('categoryId', FlowRouter.getParam('categoryId'));

        if (Categories.findOne(this.state.get('categoryId'))) {

            this.subscribe('clues', this.state.get('categoryId'));

            if (this.subscriptionsReady()) {

                this.state.set('numResults', Clues.find().count());

                const instance = this;
                Tracker.afterFlush(() => {

                    $('#removeClue').on('show.bs.modal', function (event) {
                        const button = $(event.relatedTarget);
                        const id = button.attr('data-id');
                        const modal = $(this)
                        modal.find('.remove').attr('data-id', id);
                    });

                    $('#manageChildCategories').on('hide.bs.modal', function(e) {
                        instance.state.set('currentClue', null);
                    });

                });

                LoadingState.stop();

            }

        } else {
            LoadingState.stop();
        }

    });

});

Template.clues_manager.helpers({

    clueCards() {
        
        let selector = {};

        // keyword
        const keyword = Template.instance().state.get('keyword');
        if (keyword.length > 2) {
            selector.$or = [
                {description: {$regex: keyword, $options: 'i'}},
                {date: {$regex: keyword, $options: 'i'}},
                {hint: {$regex: keyword, $options: 'i'}},
            ];
        }

        // owned
        if (Template.instance().state.get('owned')) {
            selector.ownerId = Meteor.userId();
        }

        // category
        const categoryId = Template.instance().state.get('categoryId');
        if (categoryId) {
            selector.categories = categoryId;
        }

        Logger.log('Filter Clues: ' + JSON.stringify(selector));

        const clues = Clues.find(selector, {sort:{date:-1}});
        Template.instance().state.set('numResults', clues.count());
        return clues;

    },

    categoryId() {
        return Template.instance().state.get('categoryId');
    },

    numResults() {
        let suffix = 'Results';
        if (Template.instance().state.get('numResults') == 1) {
            suffix = 'Result';
        }
        return Template.instance().state.get('numResults') + ' ' + suffix;
    },

    currentClue() {
        return Template.instance().state.get('currentClue');
    },

    currentClueName() {
        return (Template.instance().state.get('currentClue')) ? Template.instance().state.get('currentClue').formattedDate() : null;
    },

    categories() {
        return Template.instance().state.get('categories');
    },

    categoryMapper() {
        return getCategoryMapper();
    },

});

Template.clues_manager.events({

    'keyup #cluesFilter [name="keyword"]'(e, i) {
        i.state.set('keyword', e.target.value);
    },

    'change #cluesFilter [name="categoryId"]'(e, i) {
        const categoryId = e.target.options[e.target.selectedIndex].value;
        FlowRouter.go('clues.categoryId', {categoryId: categoryId});
    },

    'change #cluesFilter [name="owned"]'(e, i) {
        i.state.set('owned', e.target.checked);
    },

    'click .remove': ModelEvents.remove,

    'click .categories'(e, i) {
        const link = $(e.target);
        const id = link.attr('data-id');
        const clue = Clues.findOne(id);
        i.state.set('currentClue', clue);
        if (clue && clue.categories) {
            Meteor.call('category.get', clue.categories, function(err, res) {
                if (err) {
                    Logger.log(err, 3);
                    return;
                }
                launchCategoriesModal(i, res.map(getCategoryMapper()));
            });
        } else {
            launchCategoriesModal(i, []);
        }
    },

});

function launchCategoriesModal(i, categories) {
    i.state.set('categories', categories);
    LoadingState.stop();
    $('#manageChildCategories').modal('show');
}

function getCategoryMapper() {
    return (function(category){ return {id: category._id, value: category.theme + ': ' + category.name} });
}