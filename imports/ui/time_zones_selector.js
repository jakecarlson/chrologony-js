import { Template } from 'meteor/templating';
import { ReactiveVar } from "meteor/reactive-var";
import moment from "moment-timezone";

import './time_zones_selector.html';


Template.time_zones_selector.onCreated(function time_zones_selectorOnCreated() {

    this.loaded = new ReactiveVar(false);

    this.autorun(() => {

        this.loaded.set(false);

        if (this.subscriptionsReady()) {
            this.loaded.set(true);
        }

    });

});

Template.time_zones_selector.helpers({

    timeZones() {
        return moment.tz.names();
    },

    unready() {
        return !Template.instance().loaded.get();
    },

    small() {
        return this.small;
    },

    val() {
        return this.val;
    },

});

Template.time_zones_selector.events({

});
