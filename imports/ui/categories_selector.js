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
        return Categories.find(getCategoriesSelector(false, this.game), {sort: {name: 1}});
    },

    privateCategories() {
        return Categories.find(getCategoriesSelector(true, this.game), {sort: {name: 1}});
    },

    isUserSource(source) {
        return (source == 'user');
    },

    unready() {
        return !Template.instance().loaded.get();
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
        selector.$or = [
            {ownerId: Meteor.userId()},
            {collaborators: Meteor.userId()},
        ];
    }
    if (!inGame) {
        selector.source = 'user';
    }
    return selector;
}