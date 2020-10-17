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
        return Categories.find(
            Helpers.getCategoriesSelector({private: false, user: true, active: this.showInactive, exclude: this.excludeCategoryId}),
            {sort: {name: 1}}
        );
    },

    privateCategories() {
        return Categories.find(
            Helpers.getCategoriesSelector({private: true, user: true, active: this.showInactive, exclude: this.excludeCategoryId}),
            {sort: {name: 1}}
        );
    },

    systemCategories() {
        return Categories.find(
            Helpers.getCategoriesSelector({private: false, user: false, active: this.showInactive, exclude: this.excludeCategoryId}),
            {sort: {name: 1}}
        );
    },

    unready() {
        return !Template.instance().loaded.get();
    },

    small() {
        return this.small;
    },

    categoryLabel(category) {
        let str = '';
        if (category.source == 'user') {
            str += category.theme + ': '
        }
        str += category.name + ' (' + numeral(category.cluesCount).format('0,0') + ')';
        if (!category.active) {
            str += ' [inactive]';
        }
        return str;
    },

});

Template.categories_selector.events({

});
