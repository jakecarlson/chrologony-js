import { Meteor } from "meteor/meteor";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";

const APP = {
    name: Meteor.settings.public.app.name,
    description: Meteor.settings.public.app.description,
    keywords: Meteor.settings.public.app.keywords,
    title: Meteor.settings.public.app.name + ': ' + Meteor.settings.public.app.tagline,
    url: Meteor.absoluteUrl(),
    image: Meteor.absoluteUrl('logo.png'),
    color: '#593196',
};

let config = {

    title: APP.title,

    meta: {

        // <meta charset="UTF-8">
        charset: {
            charset: 'UTF-8',
        },

        // <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no',

        // <meta name="keywords" content="Awes..">
        keywords: {
            name: 'keywords',
            itemprop: 'keywords',
            content: APP.keywords,
        },

        // <meta name="description" itemprop="description" property="og:description" content="Default desc..">
        description: {
            name: 'description',
            itemprop: 'description',
            property: 'og:description',
            content: APP.description,
        },

        image: {
            name: 'twitter:image',
            itemprop: 'image',
            property: 'og:image',
            content: APP.image,
        },

        'og:type': 'website',
        'og:title': APP.title,
        'og:site_name': APP.name,

        url: {
            property: 'og:url',
            itemprop: 'url',
            content: APP.url,
        },

        'twitter:card': 'summary',
        'twitter:title': APP.title,
        'twitter:description': APP.description,
        // 'twitter:site': {
        //     name: 'twitter:site',
        //     value: '@twitterAccountName'
        // },
        'twitter:creator': {
            name: 'twitter:creator',
            value: '@jakecarlson'
        },

        'http-equiv': {
            'http-equiv': 'X-UA-Compatible',
            content: 'IE=edge,chrome=1'
        },

        robots: 'index, follow',
        google: 'notranslate',

        'msapplication-TileColor': APP.color,
        'msapplication-TileImage': Meteor.absoluteUrl('ms-icon-144x144.png'),
        'theme-color': APP.color,

    },

    link: {

        // <link rel="canonical" href="http://example.com">
        canonical: APP.url,

        // <link rel="image" sizes="500x500" href="http://example.com">
        image: {
            rel: 'image',
            sizes: '500x500',
            href: Meteor.absoluteUrl(),
        },

        publisher: APP.url,

        'shortcut icon': {
            rel: 'shortcut icon',
            type: 'image/x-icon',
            href: Meteor.absoluteUrl(),
        },

        'icon': {
            rel: 'icon',
            type: 'image/png',
            sizes: '192x192',
            href: Meteor.absoluteUrl('android-icon-192x192.png'),
        },

    },

    script: {
        sharethis: 'https://platform-api.sharethis.com/js/sharethis.js#property=5f7a41f2e91a79001200726d&product=inline-share-buttons'
    },

};

const appleIcons = [57, 60, 72, 76, 114, 120, 144, 152, 180];
appleIcons.forEach(function(size) {
    const dimensions = size + 'x' + size;
    config.link['apple-touch-icon-' + size] = {
        rel: 'apple-touch-icon',
        sizes: dimensions,
        href: Meteor.absoluteUrl('apple-icon-' + dimensions + '.png'),
    };
});

const icons = [16, 32, 96];
icons.forEach(function(size) {
    const dimensions = size + 'x' + size;
    config.link['icon-' + size] = {
        rel: 'icon',
        type: 'images/png',
        sizes: dimensions,
        href: Meteor.absoluteUrl('favicon-' + dimensions + '.png'),
    };
});

// Set defaults for all routes
FlowRouter.globals.push(config);