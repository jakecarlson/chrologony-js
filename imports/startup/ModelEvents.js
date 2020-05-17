import './Logger';
import { LoadingState } from './LoadingState';

export const ModelEvents = {

    edit(e, i) {
        e.preventDefault();
        i.state.set('editing', true);
        Meteor.typeahead.inject();
    },

    add(e, i) {

        LoadingState.start(e);
        const attrs = getAttrs(i);

        Meteor.call(getModelName(i) + '.create', attrs, function(error, id) {
            if (!error) {
                Logger.log('Created ' + capitalize(getModelName(i)) + ': ' + id);
                i.state.set('error', false);
                resetAttrs(i);
            } else {
                i.state.set('error', true);
            }
            LoadingState.stop();
        });

    },

    save(e, i) {

        LoadingState.start(e);
        const attrs = getAttrs(i);

        Meteor.call(getModelName(i) + '.update', attrs, function(error, updated) {
            if (!error) {
                Logger.log('Updated ' + capitalize(getModelName(i)) + ': ' + updated);
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
        Meteor.call(modelName + '.remove', id, function(error, deleted) {
            if (!error) {
                Logger.log('Deleted ' + capitalize(modelName) + ': ' + deleted);
            }
            LoadingState.stop();
        });
        i.state.set('error', false);
    },

};

function getModelName(i) {
    return i.view.name.substr(9);
}

function getAttrs(i) {
    let attrs = {}
    const inputs = i.findAll('.attr');
    for (input of inputs) {
        let val = input.value;
        if (input.type == 'checkbox') {
            val = input.checked
        }
        attrs[input.name] = val;
    }
    return attrs;
}

function resetAttrs(i) {
    const inputs = i.findAll('.attr');
    for (input of inputs) {
        if (input.type == 'checkbox') {
            input.checked = false;
        } else if (input.type != 'hidden') {
            input.value = '';
        }
    }
}

function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}