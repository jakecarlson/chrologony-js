import { Template } from 'meteor/templating';

import './featured.html';
import './featured_category.js';

Template.featured.onCreated(function featuredOnCreated() {

});

Template.featured.helpers({

    categories() {
        return this.categories;
    },

});