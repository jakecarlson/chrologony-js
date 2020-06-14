import './Logger';
import { LoadingState } from '../modules/LoadingState';

export const ModelEvents = {

    edit(e, i) {
        e.preventDefault();
        i.state.set('editing', true);
        Meteor.typeahead.inject();
    },

    add(e, i) {

        LoadingState.start(e);
        const attrs = ModelEvents.getAttrs(i.firstNode);

        Meteor.call(ModelEvents.getModelName(i) + '.create', attrs, function(err, id) {
            if (!err) {
                Logger.log('Created ' + ModelEvents.capitalize(ModelEvents.getModelName(i)) + ': ' + id);
                i.state.set('error', false);
                ModelEvents.resetAttrs(i.firstNode);
            } else {
                i.state.set('error', true);
            }
            LoadingState.stop();
            TourGuide.resume();
        });

    },

    save(e, i) {

        LoadingState.start(e);
        const attrs = ModelEvents.getAttrs(i.firstNode);

        Meteor.call(ModelEvents.getModelName(i) + '.update', attrs, function(err, updated) {
            if (!err) {
                Logger.log('Updated ' + ModelEvents.capitalize(ModelEvents.getModelName(i)) + ': ' + updated);
                i.state.set('editing', false);
                i.state.set('error', false);
            } else {
                i.state.set('error', true);
                Logger.log(i.state.get('error'));
            }
            LoadingState.stop();
        });

    },

    cancel(e, i) {
        e.preventDefault();
        i.state.set('editing', false);
        i.state.set('error', false);
    },

    remove(e, i) {
        LoadingState.start(e);
        const button = $(e.target);
        const id = button.attr('data-id');
        const modelName = button.attr('data-model');
        Meteor.call(modelName + '.remove', id, function(err, deleted) {
            if (!err) {
                Logger.log('Deleted ' + ModelEvents.capitalize(modelName) + ': ' + deleted);
            }
            LoadingState.stop();
        });
        i.state.set('error', false);
    },

    getAttrs(parent) {
        let attrs = {}
        const inputs = $(parent).find('.attr');
        for (input of inputs) {
            let val = input.value;
            if (input.type == 'checkbox') {
                val = input.checked
            } else if (!input.value || (input.value.trim().length == 0)) {
                val = null;
            }
            attrs[input.name] = val;
        }
        return attrs;
    },

    resetAttrs(parent) {
        const inputs = $(parent).find('.attr');
        for (input of inputs) {
            if (input.type == 'checkbox') {
                input.checked = false;
            } else if (input.type != 'hidden') {
                input.value = '';
            }
        }
    },

    getModelName(i) {
        return i.view.name.substr(9);
    },

    capitalize(str) {
        return str[0].toUpperCase() + str.slice(1);
    },

};