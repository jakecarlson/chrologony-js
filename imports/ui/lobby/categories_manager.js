import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { LoadingState } from "../../startup/LoadingState";

import { Categories } from "../../api/categories";
import { ModelEvents } from "../../startup/ModelEvents";

import './categories_manager.html';
import './category.js';

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

                $('#manageCategoryCollaborators').on('hide.bs.modal', function(e) {
                    instance.state.set('currentCategory', null);
                });

            });

            Meteor.typeahead.inject();

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

    searchCollaborators(query, sync, callback) {
        let collaborators = [];
        Template.instance().state.get('collaborators').forEach(function(user) {
            collaborators.push(user.id);
        });
        collaborators.push(Meteor.userId());
        Meteor.call('user.search', query, collaborators, function(err, res) {
            if (err) {
                console.log(err);
                return;
            }
            callback(res.map(function(user){ return {id: user._id, value: user.username} }));
        });
    },

    addCollaborator(e, user, source) {
        let collaborators = Template.instance().state.get('collaborators');
        collaborators.push({id: user.id, name: user.value});
        setCollaborators(Template.instance(), collaborators);
        $('#userSearch').typeahead('val', '');
    },

    collaborators() {
        return Template.instance().state.get('collaborators');
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

    'click #manageCategoryCollaborators .save'(e, i) {
        LoadingState.start(e);
        let collaborators = [];
        i.state.get('collaborators').forEach(function(user) {
            collaborators.push(user.id);
        });
        Meteor.call('category.collaborators', {_id: i.state.get('currentCategory')._id, collaborators: collaborators}, function(err, numSaved) {
            if (err) {
                console.log(err);
                return;
            }
            Logger.log('Collaborators Saved: ' + numSaved);
            LoadingState.stop();
            $('#manageCategoryCollaborators').modal('hide');
        });
    },

    'click #manageCategoryCollaborators .remove'(e, i) {
        e.preventDefault();
        let link = $(e.target);
        let id = link.attr('data-id');
        let collaborators = i.state.get('collaborators');
        let removeKey = -1;
        collaborators.forEach(function(user, i) {
            if (user.id == id) {
                removeKey = i;
                return;
            }
        });
        if (removeKey > -1) {
            collaborators.splice(removeKey, 1);
        }
        setCollaborators(i, collaborators);
    },

});

function launchCollaboratorsModal(i, collaborators) {
    i.state.set('collaborators', collaborators);
    LoadingState.stop();
    $('#manageCategoryCollaborators').modal('show');
}

function setCollaborators(i, collaborators) {
    collaborators.sort((a, b) => (a.name > b.name) ? 1 : -1);
    i.state.set('collaborators', collaborators);
}