import { Random } from 'meteor/random'
import { Clues } from '../../../imports/api/Clues';
import { Cards } from '../../../imports/api/Cards';

// Fix legacy clue IDs.
Migrations.add({

    version: 27,
    name: 'Fix legacy clue IDs.',

    up: function() {
        const clues = Clues.find({$expr: {$gt: [{"$strLenCP": "$_id"}, 17]}});
        clues.forEach(function(clue) {
            const oldId = clue._id;
            const newId = Random.id();
            let doc = clue;
            doc._id = newId;
            const insertId = Clues.rawCollection().insert(doc);
            if (insertId) {
                Cards.rawCollection().update({clueId: oldId}, {$set: {clueId: newId}}, {multi: true});
                Clues.rawCollection().remove({_id: oldId});
            }
            Logger.log(oldId + ' --> ' + newId, 3);
        });
    },

    down: function() {

    },

});