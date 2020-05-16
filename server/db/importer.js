var total = db.clues_import.countDocuments();
var chunkSize = 1000;
for (var i = 0; i < total; i += chunkSize) {
    print("Importing " + (i+1) + " - " + (i+chunkSize) + " of " + total);
    db.clues_import.find({}).sort({date: 1, description: 1}).skip(i).limit(chunkSize).forEach(function (document) {
        document._id = document._id + '';
        var parts = document.date.split("-");
        var i = (parts.length > 3) ? 1 : 0;
        var m = (parts.length > 3) ? -1 : 1;
        document.date = new Date(
            parseInt(parts[i]) * m,
            parseInt(parts[i+1]) - 1,
            parseInt(parts[i+2])
        );
        document.active = true;
        document.owner = null;
        document.createdAt = new Date();
        document.updatedAt = new Date();
        // db.clues.insert(document);
        print(document);
    });
    print("");
}

