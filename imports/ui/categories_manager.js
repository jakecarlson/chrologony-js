import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Categories } from "../api/categories";
import { ModelEvents } from "../startup/ModelEvents";

import './categories_manager.html';
import './category.js';

Template.categories_manager.onCreated(function categories_managerOnCreated() {
    this.autorun(() => {

        this.subscribe('categories');

        if (this.subscriptionsReady()) {
            Tracker.afterFlush(() => {
                $('#removeCategory').on('show.bs.modal', function (event) {
                    let button = $(event.relatedTarget);
                    let id = button.data('id');
                    let modal = $(this)
                    modal.find('.remove').attr('data-id', id);
                });
            });
        }

    });

});

Template.categories_manager.helpers({
    ownedCategories() {
        return Categories.find({owner: Meteor.userId()}, {sort:{name: 1}});
    },
});

Template.categories_manager.events({

    'click .remove': ModelEvents.remove,

});