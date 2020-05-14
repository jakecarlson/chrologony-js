import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { LoadingState } from "../../startup/LoadingState";

import './child_manager.html';

Template.child_manager.onCreated(function child_managerOnCreated() {

    this.state = new ReactiveDict();

    this.autorun(() => {

        this.state.set('children', this.view.templateInstance().data.childItems); // Hacky? Why does this re-evaluate but this.data.childItems doesn't?

        let instance = this;
        Tracker.afterFlush(() => {
            // $('#manageChild' + this.data.childrenName).on('hide.bs.modal', function(e) {
            //     instance.state.set('parent', null);
            // });

        });

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
        children.push(this.excludeId);
        let childNameKey = this.childNameKey;
        Meteor.call(this.childType + '.search', query, children, function(err, res) {
            if (err) {
                console.log(err);
                return;
            }
            callback(res.map(function(child){ return {id: child._id, value: child[childNameKey]} }));
        });
    },

    addChild(e, child, source) {
        let children = Template.instance().state.get('children');
        children.push({id: child.id, name: child.value});
        setChildren(Template.instance(), children);
        $('#' + this.childType + 'Search').typeahead('val', '');
    },

    children() {
        return Template.instance().state.get('children');
    },

});

Template.child_manager.events({

    'click .save'(e, i) {
        LoadingState.start(e);
        let children = [];
        i.state.get('children').forEach(function(child) {
            children.push(child.id);
        });
        let attrs = {
            _id: this.parent._id,
        };
        attrs[this.childrenName.toLowerCase()] = children;
        let childrenName = this.childrenName;
        Meteor.call(this.parentType.toLowerCase() + '.' + this.childrenName.toLowerCase(), attrs, function(err, numSaved) {
            if (err) {
                console.log(err);
                return;
            }
            Logger.log(childrenName + ' Saved: ' + numSaved);
            LoadingState.stop();
            $('#manageChild' + childrenName).modal('hide');
        });
    },

    'click .remove'(e, i) {
        e.preventDefault();
        let link = $(e.target);
        let id = link.attr('data-id');
        let children = i.state.get('children');
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
    children.sort((a, b) => (a.name > b.name) ? 1 : -1);
    i.state.set('children', children);
}