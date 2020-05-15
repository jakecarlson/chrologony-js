db.clues.update(
    {},
    {
        $set: {hint: null},
        $unset: {theme: ""},
    },
    {
        multi: true,
    },
);