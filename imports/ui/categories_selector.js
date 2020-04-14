import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import { Categories } from '../api/categories';

import './categories_selector.html';

Template.categories_selector.onCreated(function categories_selectorOnCreated() {
    this.state = new ReactiveDict();
    Meteor.subscribe('categories');
});

Template.categories_selector.helpers({
    publicCategories() {
        return Categories.find({private: false}, {sort:{name: 1}});
    },
    privateCategories() {
        return Categories.find({private: true, owner: Meteor.userId()}, {sort:{name: 1}});
    },
});

Template.categories_selector.events({

});