import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Categories } from '../api/categories';

import './categories_selector.html';

Template.categories_selector.onCreated(function categories_selectorOnCreated() {
    this.autorun(() => {
        this.subscribe('categories');
    });

});

Template.categories_selector.helpers({

    publicCategories() {
        return Categories.find(getCategoriesSelector(false, this.game), {sort: {name: 1}});
    },

    privateCategories() {
        return Categories.find(getCategoriesSelector(true, this.game), {sort: {name: 1}});
    },

    isUserSource(source) {
        return (source == 'user');
    },

});

Template.categories_selector.events({

});

function getCategoriesSelector(isPrivate, inGame) {
    let selector = {
        private: isPrivate,
        active: true,
    };
    if (isPrivate) {
        selector.owner = Meteor.userId();
    }
    if (!inGame) {
        selector.source = 'user';
    }
    return selector;
}