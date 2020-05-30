Formatter = {

    date(date) {
        return moment.utc(date).format("Y-MM-DD");
    },

    year(date) {
        return moment.utc(date).format("Y");
    },

    username(user) {
        if (user) {
            if (user.username) {
                return user.username;
            }
            if (user.profile && user.profile.name) {
                return user.profile.name;
            }
        }
        return null;
    },

};