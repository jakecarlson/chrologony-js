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
import './clues_filter';
import '../time_zones_selector';
import './pager';

const FILTER_FIELDS = {
    keyword: 'keyword',
    owned: 'owned',
    startYear: 'start_year',
    startMonth: 'start_month',
    startDay: 'start_day',
    startEra: 'start_era',
    endYear: 'end_year',
    endMonth: 'end_month',
    endDay: 'end_day',
    endEra: 'end_era',
}

Template.clues_manager.onCreated(function clues_managerOnCreated() {

    this.pagesDisplayed = 7;

    this.filters = new ReactiveDict();
    this.filters.set('categoryId', null);
    for (const field in FILTER_FIELDS) {
        this.filters.set(field, null);
    }
    this.filters.set('page', 1);
    this.filters.set('pageSize', Helpers.pageSize());

    this.state = new ReactiveDict();
    this.state.set('currentClue', null);
    this.state.set('categories', []);
    this.state.set('filterChanged', false);
    this.state.set('bulkAction', null);
    this.state.set('bulkAddCategoryId', null);
    this.state.set('bulkTimeZone', null);
    this.state.set('cluesSelected', false);

    this.dataReady = new ReactiveVar(false);

    this.filters.set('categoryId', FlowRouter.getParam('categoryId'));
    this.filters.set('clueId', FlowRouter.getParam('clueId'));

    this.autorun(() => {

        if (Categories.findOne(this.filters.get('categoryId'))) {

            LoadingState.start();
            const legacy = FlowRouter.getQueryParam('legacy');
            this.subscribe('clues', this.filters.all(), legacy);
            this.subscribe('cluesCount', this.filters.all(), legacy);

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

                    self.filterInputs = {};
                    for (const field in FILTER_FIELDS) {
                        self.filterInputs[field] = $(self.find('[name="' + FILTER_FIELDS[field] + '"]'));
                    }

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
            const skip = Helpers.getPageStart(i.filters.get('page'));
            const clues = Clues.find({}, {sort: {date: -1}, skip: skip, limit: Helpers.pageSize()});
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
        return Counter.get('cluesCount');
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

    pagesDisplayed() {
        return Template.instance().pagesDisplayed;
    },

    hasSelectedClues() {
        return Template.instance().state.get('cluesSelected');
    },

    showCategorySelector() {
        return addCategoryBulkActionSelected();
    },

    showTimeZoneSelector() {
        return setTimeZoneBulkActionSelected();
    },

    showCategoryOrTimeZoneSelector() {
        return (addCategoryBulkActionSelected() || setTimeZoneBulkActionSelected());
    },

    disableBulkSubmit() {
        return (
            LoadingState.active() ||
            !Template.instance().state.get('bulkAction') ||
            (
                addCategoryBulkActionSelected() &&
                !Template.instance().state.get('bulkAddCategoryId')
            ) ||
            (
                setTimeZoneBulkActionSelected() &&
                !Template.instance().state.get('bulkTimeZone')
            )
        );
    },

    isCategoryOwner() {
        const category = Categories.findOne(Template.instance().filters.get('categoryId'));
        return Permissions.owned(category, true);
    },

});

Template.clues_manager.events({

    'keyup #cluesFilter [type="text"], keyup #cluesFilter [type="number"], change #cluesFilter [type="number"], change #cluesFilter [type="checkbox"], change #cluesFilter select'(e, i) {
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
        if (i.filterInputs.keyword) {
            for (const field in FILTER_FIELDS) {
                if (i.filterInputs[field].attr('type') == 'checkbox') {
                    i.filterInputs[field].prop('checked', false);
                } else {
                    i.filterInputs[field].val(null);
                }
            }
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
        LoadingState.start(e);
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
        let categoryId = i.filters.get('categoryId');

        // Bulk add category
        if (addCategoryBulkActionSelected()) {
            categoryId = i.state.get('bulkAddCategoryId');
            Meteor.call('clue.addCategory', clueIds, categoryId, function(err, updated) {
                if (!err) {
                    Logger.log('Added Category to ' + updated + ' Clues: ' + categoryId);
                } else {
                    throw new Meteor.Error('clue-category-not-added', 'Could not add a category to a clue.', err);
                }
                reload();
            });
            $('#cluesBulkActionCategory')[0].selectedIndex = 0;
            i.state.set('bulkAddCategoryId', null);

        // Bulk remove category
        } else if (i.state.get('bulkAction') == 'remove_category') {
            Meteor.call('clue.removeCategory', clueIds, categoryId, function (err, updated) {
                if (!err) {
                    Logger.log('Removed Category from ' + updated + ' Clues: ' + categoryId);
                    if (updated != clueIds.length) {
                        const notRemoved = clueIds.length - updated;
                        Flasher.info(
                            '<strong>' + notRemoved + '</strong> ' +
                            Formatter.pluralize('clue', notRemoved) +
                            ' could not removed from this category because this is ' + Formatter.possessify(notRemoved) + ' only category.'
                        );
                    }
                } else {
                    throw new Meteor.Error('clue-category-not-removed', 'Could not remove a category from a clue.');
                }
                reload();
            });

        // Bulk set time zone
        } else if (setTimeZoneBulkActionSelected()) {
            const timeZone = i.state.get('bulkTimeZone');
            Meteor.call('clue.setTimeZone', clueIds, timeZone, function(err, updated) {
                if (!err) {
                    Logger.log('Set Time Zone for ' + updated + ' Clues: ' + timeZone);
                    if (updated != clueIds.length) {
                        const notUpdated = clueIds.length - updated;
                        Flasher.info(
                            '<strong>' + notUpdated + '</strong> ' +
                            Formatter.pluralize('clue', notUpdated) +
                            ' could not be updated with the time zone because you are not the clue owner.'
                        );
                    }
                } else {
                    throw new Meteor.Error('clue-time-zone-not-updated', 'Could not update time zone for a clue.', err);
                }
                reload();
            });
            $('#cluesBulkActionTimeZone')[0].selectedIndex = 0;
            i.state.set('bulkTimeZone', null);

        // Activate / deactivate / open / lock clues
        } else if (['activate', 'deactivate', 'open', 'lock'].includes(i.state.get('bulkAction'))) {
            handleBulkAction(i.state.get('bulkAction'), clueIds, categoryId);
        }

        $('#cluesBulkAction')[0].selectedIndex = 0;
        i.state.set('bulkAction', null);
        $('[name="id"]:checked, [name="all"]:checked').prop('checked', false).trigger('change');

    },

    'change #cluesBulkAction'(e, i) {
        i.state.set('bulkAction', e.target.value);
    },

    'change #cluesBulkActionCategory'(e, i) {
        i.state.set('bulkAddCategoryId', e.target.value);
    },

    'change #cluesBulkActionTimeZone'(e, i) {
        i.state.set('bulkTimeZone', e.target.value);
    },

    'change .pager-size [name="size"]'(e, i) {
        LoadingState.start();
        const pageSize = parseInt(e.target.value);
        i.filters.set('pageSize', pageSize);
        i.filters.set('page', 1);
    },

});

function resetFilters(i) {
    i.filters.set('page', 1);
    if (i.filterInputs.keyword) {
        for (const field in FILTER_FIELDS) {
            if (i.filterInputs[field].attr('type') == 'checkbox') {
                i.filters.set(field, i.filterInputs[field].prop('checked'));
            } else {
                i.filters.set(field, i.filterInputs[field].val());
            }
        }
    }
}

function cluesLoaded(i) {
    let limit = i.filters.get('page') * i.filters.get('pageSize');
    const total = Counter.get('cluesCount');
    if (total < limit) {
        limit = total;
    }
    return (Clues.find({}).count() >= limit);
}

function reload() {
    FlowRouter.reload();
    LoadingState.stop();
}

function handleBulkAction(action, clueIds, categoryId) {
    const actioned = Formatter.pastTensify(action);
    const attempted = clueIds.length;
    Meteor.call('clue.' + action, clueIds, function(err, updated) {
        if (!err) {
            Logger.log(Formatter.capitalize(actioned) + ' ' + updated + ' Clues: ' + categoryId);
            if (updated != attempted) {
                const notUpdated = attempted - updated;
                Flasher.info(
                    '<strong>' + notUpdated + '</strong> ' +
                    Formatter.pluralize('clue', notUpdated) +
                    ' could not be ' + actioned + ' because you are not the clue owner.'
                );
            }
        } else {
            throw new Meteor.Error(
                'clues-not-' + actioned,
                'Could not ' + action + ' ' + Formatter.pluralize('clues', attempted) + '.'
            );
        }
        reload();
    });
}

function addCategoryBulkActionSelected() {
    return (Template.instance().state.get('bulkAction') == 'add_category');
}

function setTimeZoneBulkActionSelected() {
    return (Template.instance().state.get('bulkAction') == 'set_time_zone');
}