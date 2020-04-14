import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import './categories_manager.html';
import './category.js';
import { Categories } from "../api/categories";

Template.categories_manager.onCreated(function categories_managerOnCreated() {
    this.state = new ReactiveDict();
    Meteor.subscribe('categories');
});

Template.categories_manager.helpers({
    ownedCategories() {
        return Categories.find({owner: Meteor.userId()}, {sort:{name: 1}});
    },
});

Template.categories_manager.events({

});