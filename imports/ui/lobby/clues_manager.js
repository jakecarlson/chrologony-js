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

                this.state.set('numResults', Clues.find({categories: this.state.get('categoryId')}).count());

                const self = this;
                Tracker.afterFlush(() => {

                    $('#removeClue').on('show.bs.modal', function(e) {
                        const button = $(e.relatedTarget);
                        const id = button.attr('data-id');
                        const modal = $(this)
                        modal.find('.remove').attr('data-id', id);
                    });

                    $('#manageChildCategories').on('hidden.bs.modal', function(e) {
                        self.state.set('currentClue', null);
                    });

                    $('#manageClueMore').on('hidden.bs.modal', function(e) {
                        self.state.set('currentClue', null);
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

    categoryView() {
        return ['clues', 'clues.categoryId'].includes(FlowRouter.getRouteName());
    },

    cards() {
        
        let selector = {};

        // If predefined clue, use only that
        const clueId = FlowRouter.getParam('clueId');
        if (clueId) {
            selector._id = clueId;

        } else {

            // keyword
            const keyword = Template.instance().state.get('keyword');
            if (keyword.length > 2) {
                selector.$or = [
                    {description: {$regex: keyword, $options: 'i'}},
                    {date: {$regex: keyword, $options: 'i'}},
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
        const numResults = Template.instance().state.get('numResults');
        let suffix = 'Results';
        if (numResults == 1) {
            suffix = 'Result';
        }
        return numResults + ' ' + suffix;
    },

    currentClue() {
        return Template.instance().state.get('currentClue');
    },

    currentClueName() {
        const clue = Template.instance().state.get('currentClue');
        return (clue) ? Formatter.date(clue.date) : null;
    },

    currentClueAttr(attr) {
        const clue = Template.instance().state.get('currentClue');
        if (clue) {
            return clue[attr];
        } else {
            return null;
        }
    },

});

Template.clues_manager.events({

    'keyup #cluesFilter [name="keyword"]'(e, i) {
        i.state.set('keyword', e.target.value);
    },

    'change #cluesFilter [name="categoryId"]'(e, i) {
        const categoryId = e.target.options[e.target.selectedIndex].value;
        FlowRouter.go('clues.categoryId', {categoryId: categoryId});
        TourGuide.resume();
    },

    'change #cluesFilter [name="owned"]'(e, i) {
        i.state.set('owned', e.target.checked);
    },

    'click .remove': ModelEvents.remove,

    'click .more'(e, i) {
        e.preventDefault();
        const link = $(e.target);
        const id = link.attr('data-id');
        const clue = Clues.findOne(id);
        i.state.set('currentClue', clue);
        if (clue) {
            $('#manageClueMore').modal('show');
            $('#manageClueMore .save').attr('data-id', id);
        }
    },

    'submit #manageClueMore'(e, i) {
        LoadingState.start(e);
        const form = $(e.target);
        const id = form.find('.save').attr('data-id');
        const attrs = ModelEvents.getAttrs(form);
        attrs._id = id;
        Meteor.call('clue.updateMore', attrs, function(err, updated) {
            if (!err) {
                Logger.log('Updated Clue: ' + updated);
                form.modal('hide');
            }
            LoadingState.stop();
        });
    },

});