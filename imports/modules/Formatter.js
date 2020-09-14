Formatter = {

    second(date) {
        return moment.utc(date).format("h:mm:ss A");
    },

    minute(date) {
        return moment.utc(date).format("h:mm A");
    },

    hour(date) {
        return moment.utc(date).format("h A");
    },

    date(date) {
        return moment.utc(date).format("Y-MM-DD");
    },

    month(date) {
        return moment.utc(date).format("MMM Y");
    },

    year(date, hideEra = false, factor = 1) {
        let year = (Math.floor(parseInt(moment.utc(date).format("Y")) / factor) * factor);
        let suffix = "";
        if (factor > 1) {
            suffix = "s";
        }
        let era = "";
        if (!hideEra) {
            era = " " + ((year < 0) ? "BCE" : " CE");
            year = Math.abs(year);
        }
        return year + suffix + era;
    },

    decade(date, hideEra = false) {
        return Formatter.year(date, hideEra, 10);
    },

    century(date, hideEra = false) {
        return Formatter.year(date, hideEra, 100);
    },

    millennium(date, hideEra = false) {
        return Formatter.year(date, hideEra, 1000);
    },

};