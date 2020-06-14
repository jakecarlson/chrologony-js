import { Clues } from '../../../imports/api/Clues';

// Fix clue null strings.
Migrations.add({
    version: 7,
    name: 'Fix clue null strings and zero coordinates.',
    up: function() {
        Clues.update({externalUrl: 'null'}, {$set: {externalUrl: null}}, {multi: true});
        Clues.update({externalId: 'null'}, {$set: {externalId: null}}, {multi: true});
        Clues.update({imageUrl: 'null'}, {$set: {imageUrl: null}}, {multi: true});
        Clues.update({thumbnailUrl: 'null'}, {$set: {thumbnailUrl: null}}, {multi: true});
        Clues.update({latitude: 'null'}, {$set: {latitude: null}}, {multi: true});
        Clues.update({longitude: 'null'}, {$set: {longitude: null}}, {multi: true});
        Clues.update({moreInfo: 'null'}, {$set: {moreInfo: null}}, {multi: true});
        Clues.update({latitude: 0, longitude: 0}, {$set: {latitude: null, longitude: null}}, {multi: true});
    },
    down: function() {
        // We don't ever want to reverse this!!!
    }
});