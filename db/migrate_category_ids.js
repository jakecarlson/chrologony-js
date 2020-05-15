db.clues.find().sort({date: 1}).skip(10000).limit(10000).forEach(function (document) {
    db.clues.update(
        {
            _id: document._id
        },
        {
            $set: {categories: [document.categoryId]},
            $unset: {categoryId: ""},
        }
    );
})