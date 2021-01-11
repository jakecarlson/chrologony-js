import { Template } from 'meteor/templating';

import { Categories } from '../../api/Categories';

import './featured.html';
import './featured_category.js';

Template.featured.onCreated(function featuredOnCreated() {
    this.autorun(() => {
        Helpers.subscribe(this, 'featuredCategories');
    });
});

Template.featured.helpers({

    categories() {
        const categories = Categories.find({featured: true, active: true, private: false}, {sort: {name: 1}});
        return categories;
    },

});