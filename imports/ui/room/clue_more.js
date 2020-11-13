import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './clue_more.html';

Template.clue_more.onCreated(function clue_moreOnCreated() {

});

Template.clue_more.helpers({

    name() {
        return (this.clue) ? Formatter.date(this.clue.date) : null;
    },

    attr(attr) {
        return clueAttr(this, attr);
    },

    hasAttr(attr) {
        return hasAttr(this, attr);
    },

    hasImage() {
        return hasImage(this);
    },

    imageUrl() {
        return (this.clue.imageUrl) ? this.clue.imageUrl : this.clue.thumbnailUrl;
    },

    thumbnailUrl() {
        return (this.clue.thumbnailUrl) ? this.clue.thumbnailUrl : this.clue.imageUrl;
    },

    hasLocation() {
        return hasLocation(this);
    },

    mapUrl() {
        const coords = clueAttr(this, 'latitude') + ',' + clueAttr(this, 'longitude');
        let url = 'https://www.google.com/maps/embed/v1/place?key=' + Meteor.settings.public.maps.apiKey + '&';
        url += 'zoom=' + Meteor.settings.public.maps.zoom + '&';
        url += 'maptype=' + Meteor.settings.public.maps.type + '&';
        url += 'center=' + coords + '&';
        url += 'q=' + coords;
        return url;
    },

});

Template.clue_more.events({

    'click .external-link': Helpers.handleExternalLink,

});

function hasImage(i) {
    if (i.clue) {
        return (i.clue.thumbnailUrl || i.clue.imageUrl);
    }
    return false;
}

function hasLocation(i) {
    if (i.clue) {
        return (i.clue.latitude && i.clue.longitude);
    }
    return false;
}

function hasAttr(i, attr) {
    return (i.clue && i.clue[attr]);
}

function clueAttr(i, attr) {
    if (i.clue) {
        return i.clue[attr];
    } else {
        return null;
    }
}