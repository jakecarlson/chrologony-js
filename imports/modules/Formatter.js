Formatter = {

    date(date) {
        return moment.utc(date).format("Y-MM-DD");
    },

    year(date) {
        return moment.utc(date).format("Y");
    },

};