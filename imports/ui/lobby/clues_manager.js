import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { ModelEvents } from "../../modules/ModelEvents";
import { LoadingState } from "../../modules/LoadingState";
import { Permissions } from '../../modules/Permissions';

import { Categories } from "../../api/Categories";
import { Clues } from "../../api/Clues";

import './clues_manager.html';
import './clue.js';
import './clues_filter.js';
import './pager.js';

Template.clues_manager.onCreated(function clues_managerOnCreated() {

    Session.setDefault('pageSize', 25);
    this.pagesDisplayed = 7;

    this.filters = new ReactiveDict();
    this.filters.set('keyword', '');
    this.filters.set('owned', false);
    this.filters.set('categoryId', null);
    this.filters.set('page', 1);
    this.filters.set('pageSize', Session.get('pageSize'));

    this.state = new ReactiveDict();
    this.state.set('currentClue', null);
    this.state.set('categories', []);
    this.state.set('filterChanged', false);
    this.state.set('bulkAction', null);
    this.state.set('bulkAddCategoryId', null);
    this.state.set('cluesSelected', false);

    this.dataReady = new ReactiveVar(false);

    this.filters.set('categoryId', FlowRouter.getParam('categoryId'));
    this.filters.set('clueId', FlowRouter.getParam('clueId'));

    this.autorun(() => {

        if (Categories.findOne(this.filters.get('categoryId'))) {

            LoadingState.start();
            const legacy = FlowRouter.getQueryParam('legacy');
            this.subscribe('clues', this.filters.all(), legacy);

            if (this.subscriptionsReady()) {

                Logger.log('Clues Loaded: ' + Clues.find({}).count());

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

                    self.keywordInput = self.find('[name="keyword"]');
                    self.ownedInput = self.find('[name="owned"]');

                });

                if (cluesLoaded(this)) {
                    const ms = LoadingState.stop();
                    this.dataReady.set(true);
                    if (this.previousFilters != JSON.stringify(this.filters.all())) {
                        const searchType = (legacy) ? ' (Legacy)' : '';
                        Logger.log("Filter Time" + searchType + ": " + ms + "ms");
                        let eventData = this.filters.all();
                        eventData.ms = ms;
                        Logger.audit('filterClues', {attrs: eventData});
                        Logger.track('filterClues', eventData);
                    }
                    this.previousFilters = JSON.stringify(this.filters.all());
                }

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

    canAddClue() {
        const category = Categories.findOne(Template.instance().filters.get('categoryId'));
        return (category && category.canAddClue());
    },

    clues() {
        const i = Template.instance();
        if (i.dataReady.get()) {
            const skip = Helpers.getPageStart(i.filters.get('page'), Session.get('pageSize'));
            const clues = Clues.find({}, {skip: skip, limit: Session.get('pageSize')});
            return clues;
        }
        return false;
    },

    categoryId() {
        return Template.instance().filters.get('categoryId');
    },

    categoryPrecision() {
        const category = Categories.findOne(Template.instance().filters.get('categoryId'));
        return category.precision;
    },

    cluesCount() {
        return Counts.get('cluesCount');
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

    cannotEditCurrentClue() {
        const clue = Template.instance().state.get('currentClue');
        return (!clue || !Permissions.clue.canEdit(clue, Template.instance().filters.get('categoryId')));
    },

    page() {
        return Template.instance().filters.get('page');
    },

    pageSize() {
        return Session.get('pageSize');
    },

    pagesDisplayed() {
        return Template.instance().pagesDisplayed;
    },

    hasSelectedClues() {
        return Template.instance().state.get('cluesSelected');
    },

    showCategorySelector() {
        return (Template.instance().state.get('bulkAction') == 'add_category');
    },

    disableBulkSubmit() {
        return (
            LoadingState.active() ||
            !Template.instance().state.get('bulkAction') ||
            (
                (Template.instance().state.get('bulkAction') == 'add_category') &&
                !Template.instance().state.get('bulkAddCategoryId')
            )
        );
    },

});

Template.clues_manager.events({

    'change #cluesFilter [name="keyword"]'(e, i) {
        i.state.set('filterChanged', true);
    },

    'change #cluesFilter [name="owned"]'(e, i) {
        i.state.set('filterChanged', true);
    },

    'submit #cluesFilter'(e, i) {
        LoadingState.start(e);
        resetFilters(i);
    },

    'change #cluesFilter [name="categoryId"]'(e, i) {
        LoadingState.start(e);
        const categoryId = e.target.options[e.target.selectedIndex].value;
        FlowRouter.go('clues.categoryId', {categoryId: categoryId});
        i.filters.set('categoryId', categoryId);
        if (i.keywordInput) {
            i.keywordInput.value = '';
            i.ownedInput.checked = false;
        }
        resetFilters(i);
        setTimeout(function() {
            TourGuide.resume();
        }, 250);
    },

    'click .remove': ModelEvents.remove,

    'click .more'(e, i) {
        e.preventDefault();
        const link = $(e.target).closest('a');
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
        if (attrs.latitude) {
            attrs.latitude = parseFloat(attrs.latitude);
        }
        if (attrs.longitude) {
            attrs.longitude = parseFloat(attrs.longitude);
        }
        attrs._id = id;
        Meteor.call('clue.updateMore', attrs, function(err, updated) {
            if (!err) {
                Logger.log('Updated Clue: ' + updated);
                form.modal('hide');
                i.state.set('currentClue', null);
            } else {
                throw new Meteor.Error('clue-not-updated', 'Could not update the clue.', err);
            }
            LoadingState.stop();
        });
    },

    'click [data-page]'(e, i) {
        e.preventDefault();
        const page = parseInt($(e.target).closest('a').attr('data-page'));
        i.filters.set('page', page);
    },

    'change .select-all'(e, i) {
        const checkbox = e.target;
        $('[name="id"]').prop('checked', checkbox.checked).trigger('change');
    },

    'change [name="id"]'(e, i) {
        i.state.set('cluesSelected', ($('[name="id"]:checked').length > 0));
    },

    'submit #cluesBulkActions'(e, i) {

        LoadingState.start(e);

        let clueIds = [];
        $('[name="id"]:checked').each(function() {
            clueIds.push(this.value);
        });

        if (i.state.get('bulkAction') == 'add_category') {
            const categoryId = i.state.get('bulkAddCategoryId');
            Meteor.call('clue.addCategory', clueIds, categoryId, function(err, updated) {
                if (!err) {
                    Logger.log('Added Category to ' + updated + ' Clues: ' + categoryId);
                } else {
                    throw new Meteor.Error('clue-category-not-added', 'Could not add a category to a clue.', err);
                }
                LoadingState.stop();
            });
        } else if (i.state.get('bulkAction') == 'remove_category') {
            const categoryId = i.filters.get('categoryId');
            Meteor.call('clue.removeCategory', clueIds, categoryId, function(err, updated) {
                if (!err) {
                    Logger.log('Removed Category from ' + updated + ' Clues: ' + categoryId);
                } else {
                    throw new Meteor.Error('clue-category-not-removed', 'Could not remove a category from a clue.');
                }
                LoadingState.stop();
            });
        }

        $('#cluesBulkAction')[0].selectedIndex = 0;
        i.state.set('bulkAction', null);
        if (i.state.get('bulkAddCategoryId')) {
            $('#cluesBulkActionCategory')[0].selectedIndex = 0;
            i.state.set('bulkAddCategoryId', null);
        }
        $('[name="id"]:checked, [name="all"]:checked').prop('checked', false).trigger('change');

    },

    'change #cluesBulkAction'(e, i) {
        i.state.set('bulkAction', e.target.value);
    },

    'change #cluesBulkActionCategory'(e, i) {
        i.state.set('bulkAddCategoryId', e.target.value);
    },

    'change .pager-size [name="size"]'(e, i) {
        const pageSize = parseInt(e.target.value);
        Session.set('pageSize', pageSize);
        i.filters.set('pageSize', pageSize);
        i.filters.set('page', 1);
    },

});

function resetFilters(i) {
    i.filters.set('page', 1);
    if (i.keywordInput) {
        i.filters.set('keyword', i.keywordInput.value);
        i.filters.set('owned', i.ownedInput.checked);
    }
}

function cluesLoaded(i) {
    let limit = i.filters.get('page') * i.filters.get('pageSize');
    const total = Counts.get('cluesCount');
    if (total < limit) {
        limit = total;
    }
    return (Clues.find({}).count() >= limit);
}