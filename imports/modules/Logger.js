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
        if (typeof(str) !== 'string') {
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

    audit(action, attrs = {}) {
        attrs.action = action;
        Meteor.call('log', attrs, function(err, success) {});
    },

    auditCreate(collection, id, document, exclude = []) {
        return this.audit(
            'create',
            {
                collection: 'Categories',
                documentId: id,
                attrs: _.omit(document, exclude),
            }
        );
    },

    auditUpdate(collection, id, from, to, exclude = []) {
        const diff = Helpers.diffKeys(from, to, exclude);
        if (diff.includes('deletedAt')) {
            this.auditDelete(to, id);
        } else if (diff.length > 0) {
            this.audit(
                'update',
                {
                    collection: collection,
                    documentId: id,
                    previousAttrs: _.pick(from, diff),
                    attrs: _.pick(to, diff),
                }
            );
        }
    },

    auditDelete(collection, id) {
        this.audit(
            'delete',
            {
                collection: collection,
                documentId: id,
            }
        );
    },

    conversion(action) {
        Logger.log('Conversion: ' + action);
        if (Meteor.settings.public.analyticsSettings["Microsoft Ads"][action]) {
            (function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[],f=function(){var o={ti:Meteor.settings.public.analyticsSettings["Microsoft Ads"][action]};o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")},n=d.createElement(t),n.src=r,n.async=1,n.onload=n.onreadystatechange=function(){var s=this.readyState;s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)},i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)})(window,document,"script","//bat.bing.com/bat.js","uetq");
        }
    },

};