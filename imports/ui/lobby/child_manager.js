import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { LoadingState } from "../../modules/LoadingState";

import './child_manager.html';

Template.child_manager.onCreated(function child_managerOnCreated() {

    this.state = new ReactiveDict();
    this.state.set('error', false);

    this.autorun(() => {

        this.state.set('children', this.view.templateInstance().data.childItems); // Hacky? Why does this re-evaluate but this.data.childItems doesn't?

        if (this.view.isRendered) {
            Meteor.typeahead.inject();
        }

    });

});

Template.child_manager.helpers({

    searchChildren(query, sync, callback) {
        let children = [];
        Template.instance().state.get('children').forEach(function(child) {
            children.push(child.id);
        });
        if (this.excludeId) {
            children.push(this.excludeId);
        }
        const childMapper = this.childMapper;
        Meteor.call(this.childType + '.search', query, children, function(err, res) {
            if (err) {
                Logger.log(err, 3);
                return;
            }
            callback(res.map(childMapper));
        });
    },

    addChild(e, child, source) {
        const children = Template.instance().state.get('children');
        children.push(child);
        setChildren(Template.instance(), children);
        Template.instance().state.set('error', false);
        $('#' + this.childType + 'Search').typeahead('val', '');
    },

    children() {
        return Template.instance().state.get('children');
    },

    error() {
        return Template.instance().state.get('error');
    },

});

Template.child_manager.events({

    'click .save'(e, i) {
        LoadingState.start(e);
        let children = [];
        i.state.get('children').forEach(function(child) {
            children.push(child.id);
        });
        const childrenName = this.childrenName;
        Meteor.call(this.parentType.toLowerCase() + '.set' + this.childrenName, this.parent._id, children, function(err, numSaved) {
            if (err) {
                Logger.log(err, 3);
            }
            Logger.log(childrenName + ' Saved: ' + numSaved);
            LoadingState.stop();
            $('#manageChild' + childrenName).modal('hide');
        });
    },

    'click .remove'(e, i) {
        e.preventDefault();
        const link = $(e.target);
        const id = link.attr('data-id');
        const children = i.state.get('children');
        if (this.required && children.length < 2) {
            i.state.set('error', true);
            return;
        }
        let removeKey = -1;
        children.forEach(function(child, i) {
            if (child.id == id) {
                removeKey = i;
                return;
            }
        });
        if (removeKey > -1) {
            children.splice(removeKey, 1);
        }
        setChildren(i, children);
    },

});

function setChildren(i, children) {
    children.sort((a, b) => (a.value > b.value) ? 1 : -1);
    i.state.set('children', children);
}