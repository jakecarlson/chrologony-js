import { Meteor } from "meteor/meteor";
import { SSR, Template } from 'meteor/meteorhacks:ssr';

Helpers = {

    getValues(cursor, field) {
        return cursor.fetch().map(function(item) { return item[field]; })
    },

    getIds(cursor) {
        return this.getValues(cursor, '_id');
    },

    getCategoriesSelector(filters) {
        let selector = {};
        if (filters.active) {
            selector.active = true;
        };
        if (filters.private !== false) {
            selector.$or = [
                {ownerId: Meteor.userId()},
                {collaborators: Meteor.userId()},
            ];
        }
        if (filters.private === null) {
            selector.$or.push({private: false});
        } else {
            selector.private = filters.private;
        }
        if (filters.user) {
            selector.source = 'user';
        } else {
            selector.source = {$ne: 'user'};
        }
        if (filters.exclude) {
            selector._id = {$ne: filters.exclude};
        }
        return selector;
    },

    getPageStart(pageNum, pageSize) {
        return (pageNum - 1) * pageSize;
    },

    getSelectValue(select) {
        return select.options[select.selectedIndex].value;
    },

    setSelectValue(select, value) {
        return select.value = value;
    },

    isTimePrecision(precision) {
        return ['second', 'minute', 'hour'].includes(precision);
    },

    isYearPrecision(precision) {
        return ['year', 'decade', 'century', 'millennium'].includes(precision);
    },

    stripHtml(str) {
        return str.replace(/(<([^>]+)>)/gi, "");
    },

    snakeToCamel(str) {
        return str.replace(
            /([-_][a-z])/g,
            (group) => group.toUpperCase()
                .replace('-', '')
                .replace('_', '')
        );
    },

    renderHtmlEmail(params) {
        SSR.compileTemplate(params.template, Assets.getText('email/' + params.template + '.html'));
        const html = SSR.render(params.template, params.data);
        return {
            text: Helpers.stripHtml(html),
            html: SSR.render(
                'layout_email',
                {
                    subject: params.subject,
                    preview: params.preview,
                    message: html,
                    appName: Meteor.settings.public.app.name,
                    appUrl: Meteor.absoluteUrl(),
                    logoUrl: Meteor.absoluteUrl('/logo.png'),
                }
            ),
        }
    },

};
