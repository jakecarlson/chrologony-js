import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { Permissions } from "../../modules/Permissions";
import { ModelEvents } from "../../modules/ModelEvents";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";

import './clue.html';

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
});

Template.clue.helpers({

    editing() {
        return Template.instance().state.get('editing');
    },

    error() {
        return Template.instance().state.get('error');
    },

    viewing() {
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
        return Formatter.date(this.clue.date);
    },

    date() {
        return getDate(this.clue).toISOString();
    },

    active() {
        return this.clue.active;
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
        return Math.abs(getDate(this.clue).getUTCFullYear());
    },

    month() {
        return getDate(this.clue).getUTCMonth();
    },

    day() {
        return getDate(this.clue).getUTCDate();
    },

    hours() {
        return getDate(this.clue).getUTCHours();
    },

    minutes() {
        return getDate(this.clue).getUTCMinutes();
    },

    seconds() {
        return getDate(this.clue).getUTCSeconds();
    },

    selectedMonth(month) {
        return (Formatter.zeroPad(getDate(this.clue).getUTCMonth() + 1) == month);
    },

    selectedDay(day) {
        return (Formatter.zeroPad(getDate(this.clue).getUTCDate()) == day);
    },

    selectedEra(era) {
        const val = (getDate(this.clue).getUTCFullYear() > 0) ? 1 : -1;
        return (era == val);
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

});

function getDate(clue) {
    return (clue) ? clue.date : new Date();
}

function setDate(e, i) {
    const era = getFieldVal(i, 'era');
    const year = getFieldVal(i, 'year') * era;
    const month = parseInt(getFieldVal(i, 'month')) - 1;
    const day = parseInt(getFieldVal(i, 'day'));
    let hours = getFieldVal(i, 'hours');
    let minutes = getFieldVal(i, 'minutes');
    let seconds = getFieldVal(i, 'seconds');
    const date = new Date(year, month, day, hours, minutes, seconds);
    $(i.find('[name="date"]')).val(date.toISOString());
}

function showTime(ctx) {
    return (['hour', 'minute', 'second'].includes(ctx.categoryPrecision));
}

function getFieldVal(i, field) {
    return $(i.find('[name="' + field + '"]')).val();
}