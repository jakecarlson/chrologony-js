bcrypt = require('bcryptjs');
md5 = require('md5');
Hasher = {

    bcrypt: {

        hash(str) {
            return bcrypt.hashSync(str.trim(), bcrypt.genSaltSync(Meteor.settings.crypt.saltRounds));
        },

        match(str, hash) {
            return bcrypt.compareSync(str.trim(), hash);
        },

    },

    md5: {

        hash(str) {
            return md5(str.trim() + Meteor.settings.crypt.salt);
        },

        match(str, hash) {
            return (md5(str.trim() + Meteor.settings.crypt.salt) == hash);
        },

    }

};