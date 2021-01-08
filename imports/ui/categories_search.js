import { Meteor } from "meteor/meteor";
import { Template } from 'meteor/templating';

import './categories_search.html';

Template.categories_search.onCreated(function categories_searchOnCreated() {

});

Template.categories_search.onRendered(function categories_searchOnRendered() {
    Meteor.typeahead.inject();
});

Template.categories_search.helpers({

    id() {
        return (this.id) ? this.id : 'categoryId';
    },

    small() {
        return this.small;
    },

    val() {
        return (this.category) ? this.category._id : null;
    },

    display() {
        return (this.category) ? Helpers.getCategoryLabel(this.category) : null;
    },

    placeholder() {
        return (this.placeholder != null) ? this.placeholder : 'Search for Category ...';
    },

    searchCategories(query, sync, callback) {
        let categories = [];
        const categoryMapper = function(category) { return {id: category._id, value: Helpers.getCategoryLabel(category)}};
        Meteor.call('category.search', query, categories, function(err, res) {
            if (err) {
                Logger.log(err, 3);
                return;
            }
            callback(res.map(categoryMapper));
        });
    },

    saveCategory(e, category) {
        $('#' + this.id).val(category.id).trigger('change');
    },

});

Template.categories_search.events({

});
