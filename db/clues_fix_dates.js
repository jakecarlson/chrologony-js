db.clues.find().forEach(function (document) {
    var parts = document.date.split("-");
    var i = (parts[0].length == 0) ? 1 : 0;
    var m = (parts[0].length == 0) ? -1 : 1;
    var date = new Date(
        parseInt(parts[i]) * m,
        parseInt(parts[i+1]) - 1,
        parseInt(parts[i+2])
    );
    db.clues.update({_id: document._id}, {$set: {date: date}});
})