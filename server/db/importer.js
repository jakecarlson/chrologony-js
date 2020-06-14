import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { NonEmptyString, RecordId } from "../../imports/startup/validations";
import { Clues } from "../../imports/api/Clues";

export const ImportSets = new Mongo.Collection('import_sets');
export const Imports = new Mongo.Collection('imports');

if (Meteor.isServer) {

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

        // Import queued sets
        'importer.importQueued'(chunkSize = 1000) {

            ImportSets.find({startedAt: null, completedAt: null}).fetch().forEach(function(importSet) {
                Meteor.call('importer.import', importSet._id, chunkSize, function(err, res) {
                    if (!err) {
                        Logger.log("Imported Set: " + importSet._id, 3);
                    }
                });
            });

        },

        // Import Clues
        'importer.import'(setId, chunkSize = 1000) {

            check(setId, RecordId);
            check(chunkSize, Match.Integer);

            const importSet = ImportSets.findOne(setId);
            if (importSet.startedAt || importSet.completedAt) {
                Logger.log('Import set ' + setId + ' has already been imported. Aborting.', 3);
                return;
            }

            const total = Imports.find({setId: setId}).count();
            const numChunks = Math.ceil(total / chunkSize);

            if (total == 0) {
                Logger.log('No clues to import for set ' + setId + '. Aborting.', 3);
                return;
            }

            ImportSets.update(setId, {$set: {startedAt: new Date()}});
            for (let i = 0; i < numChunks; ++i) {

                const start = i * chunkSize;
                const imports = Imports.find(
                    {
                        setId: setId,
                    },
                    {
                        sort: {date: 1, description: 1},
                        skip: start,
                        limit: chunkSize,
                    }
                );

                Logger.log("Importing " + (start+1) + " - " + (start+imports.count()) + " of " + total, 3);
                Logger.log("-".repeat(64), 3);
                imports.fetch().forEach(function (doc) {

                    // Make sure the description is less than 240 chars
                    if (doc.description.length > 240) {
                        const lastPeriod = doc.description.lastIndexOf('.', 240);
                        if (lastPeriod === -1) {
                            const lastSpace = doc.description.lastIndexOf(' ', 236);
                            doc.description = doc.description.substr(0, lastSpace) + ' ...';
                        } else {
                            doc.description = doc.description.substr(0, lastPeriod);
                        }
                    }

                    // Figure out the date
                    const parts = doc.date.split("-");
                    const n = (parts.length > 3) ? 1 : 0;
                    const year = parseInt(parts[n]) * ((parts.length > 3) ? -1 : 1);
                    const month = parseInt(parts[n+1]) - 1;
                    const day = parseInt(parts[n+2]);
                    const date = new Date(year, month, day);
                    if ((year > 0) && (year < 100)) {
                        date.setFullYear(year);
                    }
                    doc.date = date;

                    // Sort out coordinates
                    doc.latitude = parseCoord(doc.latitude);
                    doc.longitude = parseCoord(doc.longitude);

                    // Handle the category
                    doc.categories = [importSet.categoryId];

                    // Set the other defaults
                    doc.active = true;
                    doc.ownerId = null;
                    doc.createdAt = new Date();
                    doc.updatedAt = new Date();

                    // Get rid of the ID
                    doc.importId = doc._id + '';
                    delete doc._id;

                    // Ditch the set ID
                    doc.importSetId = doc.setId;
                    delete doc.setId;

                    // Get rid of 'null' strings
                    for (const attr in doc) {
                        if (doc[attr] == 'null') {
                            doc[attr] = null;
                        }
                    }

                    // Import the clue
                    Clues.upsert({importId: doc.importId}, {$setOnInsert: doc});

                    Logger.log(date.getUTCFullYear() + '-' + date.getUTCMonth() + '-' + date.getUTCDate() + ': ' + doc.description, 3);

                });
                ImportSets.update(setId, {$set: {completedAt: new Date()}});
                Logger.log("", 3);

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