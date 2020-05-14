import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { LoadingState } from "../../startup/LoadingState";

import { Categories } from "../../api/categories";
import { ModelEvents } from "../../startup/ModelEvents";

import './categories_manager.html';
import './category.js';
import './child_manager.js';

Template.categories_manager.onCreated(function categories_managerOnCreated() {

    this.state = new ReactiveDict();
    this.state.set('currentCategory', null);
    this.state.set('collaborators', []);

    this.autorun(() => {

        LoadingState.start();
        this.subscribe('categories');

        if (this.subscriptionsReady()) {

            let instance = this;
            Tracker.afterFlush(() => {

                $('#removeCategory').on('show.bs.modal', function(e) {
                    let button = $(e.relatedTarget);
                    let id = button.attr('data-id');
                    let modal = $(this)
                    modal.find('.remove').attr('data-id', id);
                });

                $('#manageChildCollaborators').on('hide.bs.modal', function(e) {
                    instance.state.set('currentCategory', null);
                });

            });

            LoadingState.stop();

        }

    });

});

Template.categories_manager.helpers({

    ownedCategories() {
        return Categories.find({owner: Meteor.userId()}, {sort:{name: 1}});
    },

    currentCategory() {
        return Template.instance().state.get('currentCategory');
    },

    currentCategoryName() {
        return (Template.instance().state.get('currentCategory')) ? Template.instance().state.get('currentCategory').name : null;
    },

    collaborators() {
        return Template.instance().state.get('collaborators');
    },

    currentUserId() {
        return Meteor.userId();
    },

});

Template.categories_manager.events({

    'click #removeCategory .remove': ModelEvents.remove,

    'click .collaborators'(e, i) {
        LoadingState.start(e);
        let link = $(e.target);
        let id = link.attr('data-id');
        const category = Categories.findOne(id);
        i.state.set('currentCategory', category);
        if (category && category.collaborators) {
            Meteor.call('user.get', category.collaborators, function(err, res) {
                if (err) {
                    console.log(err);
                    return;
                }
                launchCollaboratorsModal(i, res.map(function(user){ return {id: user._id, name: user.username} }));
            });
        } else {
            launchCollaboratorsModal(i, []);
        }
    },

});

function launchCollaboratorsModal(i, collaborators) {
    i.state.set('collaborators', collaborators);
    LoadingState.stop();
    $('#manageChildCollaborators').modal('show');
}