import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Categories } from '../api/categories';

import './categories_selector.html';
import {ReactiveDict} from "meteor/reactive-dict";

Template.categories_selector.onCreated(function categories_selectorOnCreated() {

    this.state = new ReactiveDict();

    this.autorun(() => {

        this.state.set('ready', false);
        this.subscribe('categories');

        if (this.subscriptionsReady()) {
            this.state.set('ready', true);
        }

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

    unready() {
        return !Template.instance().state.get('ready');
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