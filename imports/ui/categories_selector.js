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
        return Categories.find({private: false, active: true}, {sort:{name: 1}});
    },
    privateCategories() {
        return Categories.find({private: true, owner: Meteor.userId(), active: true}, {sort:{name: 1}});
    },
});

Template.categories_selector.events({

});