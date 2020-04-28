Template.registerHelper('collectionNotEmpty', function(collection) {
    return (collection.count() > 0);
});

Template.registerHelper('loading', function() {
    return Session.get('loading');
});

Template.registerHelper('selectedValue', function(id) {
    return (id == this.val);
});