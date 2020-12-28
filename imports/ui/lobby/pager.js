import { Template } from 'meteor/templating';

import './pager.html';
import {Meteor} from "meteor/meteor";

Template.pager.onCreated(function pagerOnCreated() {

    this.displayed = this.data.displayed;
    if (!this.displayed) {
        this.displayed = 7;
    }
    this.rand = Math.ceil(Math.random() * 100);

});

Template.pager.helpers({

    dataReady() {
        return this.total;
    },

    first() {
        return numeral(getFirst(this.page) + 1).format('0,0');
    },

    last() {
        return numeral(getLast(this.page, this.total)).format('0,0');
    },

    previous() {
        let previous = this.page - 1;
        if (previous < 1) {
            previous = false;
        }
        return previous;
    },

    next() {
        const numPages = getNumPages(this.total);
        let next = this.page + 1;
        if (next > numPages) {
            next = false;
        }
        return next;
    },

    total() {
        return numeral(this.total).format('0,0');
    },

    items() {
        return this.items;
    },

    showResults() {
        return !this.hideResults;
    },

    showPages() {
        return (!this.hidePages && (getNumPages(this.total) > 1));
    },

    pages() {

        const numPages = getNumPages(this.total);
        const sides = Math.floor(Template.instance().displayed / 2);

        let min = this.page - sides;
        if (min < 1) {
            min = 1;
        }

        let max = min + Template.instance().displayed - 1;
        if (max > numPages) {
            max = numPages;
        }

        let pages = [];
        for (let i = min; i <= max; ++i) {
            pages.push(i);
        }
        return pages;

    },

    isActive(page) {
        return (page == this.page);
    },

    disabled(page) {
        return (page === false);
    },

    showSizer() {
        return !this.hideSizer;
    },

    sizes() {
        return [5, 10, 25, 50, 100];
    },

    sizeSelected(size) {
        return (size == Helpers.pageSize());
    },

    formatSize(size) {
        return numeral(size).format('0,0');
    },

    rand() {
        return Template.instance().rand;
    },

});

Template.pager.events({

    'change .pager-size [name="size"]'(e, i) {
        const pageSize = parseInt(e.target.value);
        Meteor.call('user.updateProfile', {pageSize: pageSize}, function(err) {
            if (err) {
                Flasher.error('Page size setting failed to save. Please try again.');
            }
        });
    },

});

function getFirst(pageNum) {
    return Helpers.getPageStart(pageNum);
}

function getLast(pageNum, total) {
    let last = pageNum * Helpers.pageSize();
    if (last > total) {
        last = total;
    }
    return last;
}

function getNumPages(total) {
    return Math.ceil(total / Helpers.pageSize());
};