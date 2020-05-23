bcrypt = require('bcryptjs');
Hasher = {

    hash(str) {
        return bcrypt.hashSync(str.trim(), bcrypt.genSaltSync(Meteor.settings.crypt.saltRounds));
    },

    match(str, hash) {
        return bcrypt.compareSync(str.trim(), hash);
    },

};