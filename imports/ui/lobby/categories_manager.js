import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { LoadingState } from "../../modules/LoadingState";

import { Categories } from "../../api/Categories";
import { ModelEvents } from "../../modules/ModelEvents";

import './categories_manager.html';
import './category.js';
import './child_manager.js';

Template.categories_manager.onCreated(function categories_managerOnCreated() {

    this.state = new ReactiveDict();
    this.state.set('currentCategory', null);
    this.state.set('collaborators', []);

    this.autorun(() => {

        LoadingState.start();

        if (this.subscriptionsReady()) {

            const instance = this;
            Tracker.afterFlush(() => {

                $('#removeCategory').on('show.bs.modal', function(e) {
                    const button = $(e.relatedTarget);
                    const id = button.attr('data-id');
                    const modal = $(this)
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
        return Categories.find({ownerId: Meteor.userId()}, {sort: {theme: 1, name: 1}});
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

    userMapper() {
        return getUserMapper();
    },

});

Template.categories_manager.events({

    'click #removeCategory .remove': ModelEvents.remove,

    'click .collaborators'(e, i) {
        const link = $(e.target);
        const id = link.attr('data-id');
        const category = Categories.findOne(id);
        i.state.set('currentCategory', category);
        if (category && category.collaborators) {
            Meteor.call('user.get', category.collaborators, function(err, res) {
                if (err) {
                    Logger.log(err, 3);
                    return;
                }
                launchCollaboratorsModal(i, res.map(getUserMapper()));
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

function getUserMapper() {
    return (function(user){ return {id: user._id, value: user.username} });
}