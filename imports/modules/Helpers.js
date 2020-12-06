import { Meteor } from "meteor/meteor";
import { SSR, Template } from 'meteor/meteorhacks:ssr';
import { Session } from "meteor/session";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { LoadingState } from "./LoadingState";

import { Cards } from "../api/Cards";

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

    diffKeys(obj1, obj2, exclude = []) {

        const excludeKeys = ['createdAt', 'updatedAt'].concat(exclude);

        const diff = Object.keys(obj1).reduce((result, key) => {
            if (!obj2.hasOwnProperty(key)) {
                result.push(key);
            } else if (_.isEqual(obj1[key], obj2[key])) {
                const resultKeyIndex = result.indexOf(key);
                result.splice(resultKeyIndex, 1);
            }
            return result;
        }, Object.keys(obj2));

        return _.difference(diff, excludeKeys);

    },

    randomStr(numChars) {
        return Math.random().toString(36).substr(2, numChars).toUpperCase();
    },

    redirectToPrevious(defaultRoute = 'lobby') {
        let redirect = false;
        if (FlowRouter.getQueryParam('redirect')) {
            redirect = FlowRouter.getQueryParam('redirect');
        } else if (Session.get('redirect')) {
            redirect = Session.get('redirect');
        }
        if (redirect) {
            Logger.log('Redirect To: ' + redirect);
            delete Session.keys['redirect'];
            FlowRouter.go(redirect);
        } else {
            Logger.log('Redirect To: ' + defaultRoute);
            FlowRouter.go(defaultRoute);
        }
    },

    isGuest() {
        return (Meteor.userId() && Meteor.user().guest);
    },

    isAnonymous() {
        return (Meteor.user() && (Meteor.user().currentGameId == 'anonymous'));
    },

    subscribe(ctx, name, arg) {
        Logger.log('Subscribe: ' + name);
        ctx.subscribe(name, arg);
    },
    
    showClueMore(e, i) {
        e.preventDefault();
        const card = $(e.target).closest('.game-card');
        const id = card.attr('data-id');
        i.clueMore.set(Cards.findOne(id).clue());
        if (i.clueMore.get()) {
            $('#clueMore').modal('show');
        }
    },

    handleExternalLink(e, i) {
        e.preventDefault();
        const url = $(e.target).closest('a').attr('href');
        Logger.log('Open External URL: ' + url);
        window.open(url, '_system');
    },

    isNonEmptyString(str) {
        return (str && (str.length > 0));
    },

    currentGameId() {
        return (Meteor.userId() ? Meteor.user({fields: {currentGameId: 1}}).currentGameId : null);
    },

    currentAndPreviousGameIds() {
        let gameIds = [this.currentGameId()];
        if (Session.get('lastOwnedGameId')) {
            gameIds.push(Session.get('lastOwnedGameId'));
        }
        return gameIds;
    },

    joinGame(id, password = null, userId = null) {

        LoadingState.start();

        Meteor.call('game.join', id, password, userId, function(err, id) {

            if (!err) {

                Logger.log('Joined Game: ' + id);
                Flasher.set(
                    'success',
                    "Success! Invite others to join using any of the options under the 'Invite' button.",
                    10000
                );
                Helpers.closeModal();

                if (id) {
                    FlowRouter.go('game', {id: id});
                } else {
                    FlowRouter.go('lobby');
                }

            } else {
                Flasher.set(
                    'danger',
                    "Could not join game. Please try again."
                );
                FlowRouter.go('lobby');
            }

        });
    },

    // Hack to hide modal backdrop
    closeModal() {
        $(document.body).removeClass('modal-open');
        $('.modal-backdrop').hide();
    },

};
