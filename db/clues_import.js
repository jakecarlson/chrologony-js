db.clues_import.find().forEach(function (document) {
    document._id = document._id + '';
    var parts = document.date.split("-");
    var i = (parts.length > 3) ? 1 : 0;
    var m = (parts.length > 3) ? -1 : 1;
    document.date = new Date(
        parseInt(parts[i]) * m,
        parseInt(parts[i+1]) - 1,
        parseInt(parts[i+2])
    );
    document.createdAt = new Date();
    document.updatedAt = new Date();
    db.clues.insert(document);
});