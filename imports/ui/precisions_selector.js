import { Template } from 'meteor/templating';

import { Games } from "../api/Games";

import './precisions_selector.html';

Template.precisions_selector.onCreated(function precisions_selectorOnCreated() {

});

Template.precisions_selector.helpers({

    precisions() {
        return Games.PRECISION_OPTIONS;
    },

    capitalize(str) {
        return Formatter.capitalize(str);
    },

});

Template.precisions_selector.events({

});