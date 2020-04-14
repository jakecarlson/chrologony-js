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

export const ModelEvents = {

    edit: function(e, i) {
        e.preventDefault();
        i.state.set('editing', true);
    },

    add: function(e, i) {

        e.preventDefault();
        let attrs = getAttrs(i);

        Meteor.call(getModelName(i) + '.insert', attrs, function(error, id) {
            if (!error) {
                console.log('insert successful; new ID: ' + id);
            }
        });

        resetAttrs(i);

    },

    save: function(e, i) {

        e.preventDefault();
        let attrs = getAttrs(i);

        Meteor.call(getModelName(i) + '.update', attrs, function(error, updated) {
            if (!error) {
                console.log('updated: ' + updated);
            }
        });

        i.state.set('editing', false);

    },

    cancel: function(e, i) {
        e.preventDefault();
        i.state.set('editing', false);
    },

    remove: function(e, i) {
        console.log('remove');
    },

};