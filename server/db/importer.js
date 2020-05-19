import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { NonEmptyString, RecordId } from "../../imports/startup/validations";
import { Clues } from "../../imports/api/Clues";

if (Meteor.isServer) {

    const ImportSets = new Mongo.Collection('import_sets');
    const Imports = new Mongo.Collection('imports');

    Meteor.methods({

        // Add import set
        'importer.addSet'(name, categoryId) {

            check(name, NonEmptyString);
            check(categoryId, RecordId);

            return ImportSets.insert({
                name: name,
                categoryId: categoryId,
                createdAt: new Date(),
                startedAt: null,
                completedAt: null,
            });

        },

        // Reset import set
        'importer.resetSet'(id, removeClues = false) {

            check(id, RecordId);

            if (removeClues) {
                Clues.remove({importSetId: id});
            }

            return ImportSets.update(
                id,
                {
                    $set: {
                        startedAt: null,
                        completedAt: null,
                    }
                }
            );

        },

        // Delete import set
        'importer.removeSet'(id) {

            check(id, RecordId);

            return ImportSets.remove(id);

        },

        // Import Clues
        'importer.import'(setId, chunkSize = 1000) {

            check(setId, RecordId);
            check(chunkSize, Match.Integer);

            const total = Imports.find({setId: setId}).count();
            const numChunks = Math.ceil(total / chunkSize);

            const importSet = ImportSets.findOne(setId);

            if (importSet.completedAt) {
                Logger.log('Import Set ' + setId + ' has already been imported. Aborting.');
                return;
            }

            ImportSets.update(setId, {$set: {startedAt: new Date()}});
            for (let i = 0; i < numChunks; ++i) {

                const start = i * chunkSize;
                Logger.log("Importing " + (start+1) + " - " + (start+chunkSize) + " of " + total);
                Logger.log("-".repeat(64));
                Imports.find(
                    {
                        setId: setId,
                    },
                    {
                        sort: {date: 1, description: 1},
                        skip: start,
                        limit: chunkSize,
                    }
                ).fetch().forEach(function (document) {

                    // Make sure the description is less than 240 chars
                    if (document.description.length > 240) {
                        const lastPeriod = document.description.lastIndexOf('.', 240);
                        if (lastPeriod === -1) {
                            const lastSpace = document.description.lastIndexOf(' ', 236);
                            document.description = document.description.substr(0, lastSpace) + ' ...';
                        } else {
                            document.description = document.description.substr(0, lastPeriod);
                        }
                    }

                    // Figure out the date
                    const parts = document.date.split("-");
                    const n = (parts.length > 3) ? 1 : 0;
                    const year = parseInt(parts[n]) * ((parts.length > 3) ? -1 : 1);
                    const month = parseInt(parts[n+1]) - 1;
                    const day = parseInt(parts[n+2]);
                    const date = new Date(year, month, day);
                    if ((year > 0) && (year < 100)) {
                        date.setFullYear(year);
                    }
                    document.date = date;

                    // Sort out coordinates
                    document.latitude = parseCoord(document.latitude);
                    document.longitude = parseCoord(document.longitude);

                    // Handle the category
                    document.categories = [importSet.categoryId];

                    // Set the other defaults
                    document.active = true;
                    document.ownerId = null;
                    document.createdAt = new Date();
                    document.updatedAt = new Date();

                    // Get rid of the ID
                    document.importId = document._id + '';
                    delete document._id;

                    // Ditch the set ID
                    document.importSetId = document.setId;
                    delete document.setId;

                    // Import the clue
                    Clues.upsert({importId: document.importId}, {$setOnInsert: document});

                    Logger.log(date.getUTCFullYear() + '-' + date.getUTCMonth() + '-' + date.getUTCDate() + ': ' + document.description);

                });
                ImportSets.update(setId, {$set: {completedAt: new Date()}});
                Logger.log("");

            }

        },

    });

}

function parseCoord(coord) {
    const parsedCoord = parseFloat(coord);
    if (isNaN(coord) || isNaN(parsedCoord)) {
        return null;
    } else {
        return parsedCoord;
    }
}