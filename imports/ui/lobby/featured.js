import { Template } from 'meteor/templating';
import { ReactiveVar } from "meteor/reactive-var";
import { Categories } from '../../api/Categories';

import './featured.html';
import './featured_category.js';
import '../loader.js';

Template.featured.onCreated(function featuredOnCreated() {

    this.categories = new ReactiveVar(false);
    this.autorun(() => {
        const categories = Categories.find(
            {featured: true, active: true, private: false},
            {sort: {name: 1}}
        );
        if (categories.count() > 0) {
            this.categories.set(categories);
        }
    });

});

Template.featured.helpers({

    dataReady() {
        return Template.instance().categories.get();
    },

    categories() {
        return Template.instance().categories.get();
    },

});