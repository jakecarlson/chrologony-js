import { LoadingState } from './LoadingState';

export const ModelEvents = {

    edit: function(e, i) {
        e.preventDefault();
        i.state.set('editing', true);
    },

    add: function(e, i) {

        LoadingState.start(e);
        let attrs = getAttrs(i);

        Meteor.call(getModelName(i) + '.insert', attrs, function(error, id) {
            if (!error) {
                console.log('Created ' + capitalize(getModelName(i)) + ': ' + id);
                i.state.set('error', false);
                resetAttrs(i);
            } else {
                i.state.set('error', true);
            }
            LoadingState.stop();
        });

    },

    save: function(e, i) {

        LoadingState.start(e);
        let attrs = getAttrs(i);

        Meteor.call(getModelName(i) + '.update', attrs, function(error, updated) {
            if (!error) {
                console.log('Updated ' + capitalize(getModelName(i)) + ': ' + updated);
                i.state.set('editing', false);
                i.state.set('error', false);
            } else {
                i.state.set('error', true);
                console.log(i.state.get('error'));
            }
            LoadingState.stop();
        });

    },

    cancel: function(e, i) {
        e.preventDefault();
        i.state.set('editing', false);
        i.state.set('error', false);
    },

    remove: function(e, i) {
        LoadingState.start(e);
        let button = $(e.target);
        let id = button.data('id');
        let modelName = button.data('model');
        Meteor.call(modelName + '.delete', id, function(error, deleted) {
            if (!error) {
                console.log('Deleted ' + capitalize(modelName) + ': ' + deleted);
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
    let inputs = i.findAll('.attr');
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
    let inputs = i.findAll('.attr');
    for (input of inputs) {
        if (input.type == 'checkbox') {
            input.checked = false;
        } else {
            input.value = '';
        }
    }
}

function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}