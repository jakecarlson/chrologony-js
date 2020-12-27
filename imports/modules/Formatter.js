

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

    datetime(datetime) {
        return moment.utc(datetime).format("Y-MM-DD h:mm A");
    },

    relativeTime(datetime) {
        return moment.utc(datetime).fromNow();
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

    capitalize(str) {
        return str[0].toUpperCase() + str.slice(1);
    },

    pluralize(str, qty) {
        if (qty == 1) {
            return str;
        } else {
            return str + 's';
        }
    },

    possessify(qty) {
        return ((qty == 1) ? 'its' : 'their');
    },

    pastTensify(str) {
        str += (str.substr(str.length-1) != 'e') ? 'e' : '';
        str += 'd';
        return str;
    },

    nl2br(str) {
        return str.replace(/(?:\r\n|\r|\n)/g, '<br>');
    },

    zeroPad(num, length = 2) {
        return ('000000000' + num).substr(-length);
    },

};