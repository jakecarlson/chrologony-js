Template.registerHelper('collectionNotEmpty', function(collection) {
    return (collection.count() > 0);
});