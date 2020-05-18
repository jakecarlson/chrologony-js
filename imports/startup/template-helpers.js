import { LoadingState } from '../modules/LoadingState';

Template.registerHelper('collectionNotEmpty', function(collection) {
    return (collection.count() > 0);
});

Template.registerHelper('loading', function() {
    return LoadingState.active();
});

Template.registerHelper('selectedValue', function(id) {
    return (id == this.val);
});