import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { Permissions } from "../../modules/Permissions";
import { ModelEvents } from "../../modules/ModelEvents";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import moment from 'moment-timezone';

import { Clues } from "../../api/Clues";

import './clue.html';
import '../time_zones_selector';

Template.clue.onCreated(function clueOnCreated() {

    this.state = new ReactiveDict();
    this.state.set('editing', (this.data.clue === false));
    this.state.set('error', false);
    this.state.set('selected', false);

    const clueId = FlowRouter.getParam('clueId');
    if (clueId && (clueId == this.data.clue._id)) {
        this.state.set('editing', true);
    }

});

Template.clue.onRendered(function clueOnRendered() {
    this.$('[data-toggle="toggle"]').bootstrapToggle();
    if (this.data.clue === false) {
        $(Template.instance().find('[name="timeZone"]')).val(Clues.DEFAULT_TIMEZONE);
    }
});

Template.clue.helpers({

    editing(owner = null) {
        if (owner === false) {
            return false;
        }
        return Template.instance().state.get('editing');
    },

    error() {
        return Template.instance().state.get('error');
    },

    viewing(owner = null) {
        if (owner === false) {
            return true;
        }
        return !Template.instance().state.get('editing');
    },

    selected() {
        return Template.instance().state.get('selected');
    },

    id() {
        return this.clue._id;
    },

    description() {
        return this.clue.description;
    },

    formattedDate() {
        if (showTime(this)) {
            return Formatter.datetime(this.clue.date) + ' ' + Clues.DEFAULT_TIMEZONE;
        } else {
            return Formatter.date(this.clue.date) + ' ' + Clues.DEFAULT_TIMEZONE;
        }
    },

    date() {
        return getDate(this.clue).toISOString();
    },

    active() {
        return this.clue.active;
    },

    open() {
        return this.clue.open;
    },

    isOwner() {
        return Permissions.owned(this.clue, true);
    },

    categoryId() {
        return this.categoryId;
    },

    hint() {
        return this.clue.hint;
    },

    newClue() {
        return !this.clue;
    },

    canEdit() {
        if (!this.clue) {
            return true;
        }
        return this.clue.canEdit(this.categoryId);
    },

    canRemove() {
        return Permissions.owned(this.clue, true);
    },

    showTime() {
        return showTime(this);
    },

    months() {
        let months = [];
        for (let i = 1; i < 13; ++i) {
            const val = Formatter.zeroPad(i);
            months.push({id: val, val: val});
        }
        return months;
    },

    days() {
        let days = [];
        for (let i = 1; i < 32; ++i) {
            const val = Formatter.zeroPad(i);
            days.push({id: val, val: val});
        }
        return days;
    },

    year() {
        return Math.abs(getDate(this.clue).year());
    },

    month() {
        return getDate(this.clue).month();
    },

    day() {
        return getDate(this.clue).date();
    },

    hours() {
        return getDate(this.clue).hours();
    },

    minutes() {
        return getDate(this.clue).minutes();
    },

    seconds() {
        return getDate(this.clue).seconds();
    },

    selectedMonth(month) {
        return (Formatter.zeroPad(getDate(this.clue).month() + 1) == month);
    },

    selectedDay(day) {
        return (Formatter.zeroPad(getDate(this.clue).date()) == day);
    },

    selectedEra(era) {
        const val = (getDate(this.clue).year() > 0) ? 1 : -1;
        return (era == val);
    },

    timeZone() {
        return this.clue.timeZone;
    },

});

Template.clue.events({

    'click .edit': ModelEvents.edit,
    'click .add': ModelEvents.add,
    'click .save': ModelEvents.save,
    'click .cancel': ModelEvents.cancel,

    'change [name="id"]'(e, i) {
        i.state.set('selected', e.target.checked);
    },

    'change [name="year"]': setDate,
    'change [name="month"]': setDate,
    'change [name="day"]': setDate,
    'change [name="hours"]': setDate,
    'change [name="minutes"]': setDate,
    'change [name="seconds"]': setDate,
    'change [name="timeZone"]': setDate,

});

function getDate(clue) {
    if (clue) {
        return moment.tz(clue.date, clue.timeZone);
    } else {
        const now = moment.utc();
        return moment.utc([now.year(), now.month(), now.date(), 12]);
    }
}

function setDate(e, i) {
    const era = getFieldVal(i, 'era');
    const year = getFieldVal(i, 'year') * era;
    const month = parseInt(getFieldVal(i, 'month')) - 1;
    const day = parseInt(getFieldVal(i, 'day'));
    const hours = getFieldVal(i, 'hours');
    const minutes = getFieldVal(i, 'minutes');
    const seconds = getFieldVal(i, 'seconds');
    const timeZone = getFieldVal(i, 'timeZone');
    const date = moment.tz([year, month, day, hours, minutes, seconds], timeZone);
    $(i.find('[name="date"]')).val(date.toISOString());
}

function showTime(ctx) {
    return (['hour', 'minute', 'second'].includes(ctx.categoryPrecision));
}

function getFieldVal(i, field) {
    return $(i.find('[name="' + field + '"]')).val();
}