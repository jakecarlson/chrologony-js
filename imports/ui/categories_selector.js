import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from "meteor/reactive-var";

import { Categories } from '../api/Categories';

import './categories_selector.html';

Template.categories_selector.onCreated(function categories_selectorOnCreated() {

    this.loaded = new ReactiveVar(false);

    this.autorun(() => {

        this.loaded.set(false);

        if (this.subscriptionsReady()) {
            this.loaded.set(true);
        }

    });

});

Template.categories_selector.helpers({

    publicCategories() {
        return Categories.find(Helpers.getCategoriesSelector(false, this.hideNonUser, this.showInactive, this.excludeCategoryId), {sort: {name: 1}});
    },

    privateCategories() {
        return Categories.find(Helpers.getCategoriesSelector(true, this.hideNonUser, this.showInactive, this.excludeCategoryId), {sort: {name: 1}});
    },

    isUserSource(source) {
        return (source == 'user');
    },

    inactive(category) {
        return !category.active;
    },

    unready() {
        return !Template.instance().loaded.get();
    },

    small() {
        return this.small;
    },

});

Template.categories_selector.events({

});
