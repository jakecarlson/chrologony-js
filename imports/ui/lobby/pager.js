import { Template } from 'meteor/templating';

import './pager.html';

Template.pager.onCreated(function pagerOnCreated() {

    this.displayed = this.data.displayed;
    if (!this.displayed) {
        this.displayed = 7;
    }

});

Template.pager.helpers({

    dataReady() {
        return this.total;
    },

    first() {
        return numeral(getFirst(this.page, this.size) + 1).format('0,0');
    },

    last() {
        return numeral(getLast(this.page, this.size, this.total)).format('0,0');
    },

    previous() {
        let previous = this.page - 1;
        if (previous < 1) {
            previous = false;
        }
        return previous;
    },

    next() {
        const numPages = getNumPages(this.total, this.size);
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
        return (!this.hidePages && (getNumPages(this.total, this.size) > 1));
    },

    pages() {

        const numPages = getNumPages(this.total, this.size);
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
        return [5,10,25,50,100];
    },

    sizeSelected(size) {
        return (size == this.size);
    },

});

Template.pager.events({

});

function getFirst(pageNum, pageSize) {
    return (pageNum - 1) * pageSize;
}

function getLast(pageNum, pageSize, total) {
    let last = pageNum * pageSize;
    if (last > total) {
        last = total;
    }
    return last;
}

function getNumPages(total, pageSize) {
    return Math.ceil(total / pageSize);
};