import { Meteor } from "meteor/meteor";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";

Logger = {

    _config: {
        timestamp: true,
        prefix: null,
        level: 3,
    },

    init(config = null) {
        if (Meteor.isDevelopment) {
            this.config({
                timestamp: false,
                level: 1,
            });
        }
        if (config) {
            this.config(config);
        }
    },

    config(obj) {
        this._config = {...this._config, ...obj};
    },

    log(str, level = 1) {
        if (typeof str !== 'string') {
            str = JSON.stringify(str);
        }
        if ((level >= this._config.level) || FlowRouter.getQueryParam('debug')) {
            if (this._config.prefix) {
                str = this._config.prefix + ' ' + str;
            }
            if (this._config.timestamp) {
                str += ' [' + new Date() + ']';
            }
            console.log(str);
        }
    },

    track(event, params = {}) {
        if (Meteor.userId()) {
            params.userId = Meteor.userId();
        }
        this.log('Log Event: ' + event + '; ' + JSON.stringify(params));
        analytics.track(event, params);
    },

};