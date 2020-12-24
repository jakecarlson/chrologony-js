import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { NonEmptyString, RecordId } from "../../imports/startup/validations";
import { Promise } from "meteor/promise";

import { Clues } from "../../imports/api/Clues";

export const ImportSets = new Mongo.Collection('import_sets');
export const Imports = new Mongo.Collection('imports', {idGeneration: 'MONGO'});

if (Meteor.isServer) {

    Meteor.methods({

        // Add import set
        'importer.addSet'(name, categoryId) {

            check(name, NonEmptyString);
            check(categoryId, RecordId);

            return ImportSets.insert({
                name: name,
                categoryId: categoryId,
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

        },

        // Remove imports from set
        'importer.removeImports'(setId) {
            check(setId, RecordId);
            return Imports.remove({setId: setId});
        },

        // Delete import set
        'importer.removeSet'(id) {
            check(id, RecordId);
            return ImportSets.remove(id);
        },

        // Disable Set
        'importer.disableSet'(id) {
            check(id, RecordId);
            return ImportSets.update(id, {$set: {active: false}});
        },

        // Enable Set
        'importer.enableSet'(id) {
            check(id, RecordId);
            return ImportSets.update(id, {$set: {active: true}});
        },

        // Import queued sets
        'importer.importQueued'(chunkSize = 1000) {

            ImportSets.find({active: true}, {sort: {createdAt: 1}}).fetch().forEach(function(importSet) {
                Meteor.call('importer.import', importSet._id, chunkSize);
            });

        },

        // Purge duplicates in a set that exist in another set
        'importer.purgeDuplicates'(setId, deleteThreshold = .5, reportThreshold = .3) {

            // We'll get one big output string so that we can write that to file
            let out = '';

            // Find dupes grouping by date + external ID
            const imports = Promise.await(
                Imports.rawCollection().aggregate([
                    {
                        $match : {setId: setId},
                    },
                    {
                        $group: {
                            _id: {date: "$date", externalId: "$externalId"},
                            count: {$sum: 1},
                            importIds: {$push: "$_id"},
                            descriptions: {$push: "$description"},
                            externalIds: {$push: "$externalId"},
                        }
                    },
                    {
                        $sort: {
                            date: 1,
                            externalId: 1,
                            createdAt: 1,
                            description: 1,
                        },
                    },
                    {
                        $match: {count: {$gt: 1}}
                    }
                ]).toArray()
            );

            // Loop through all groupings and save the dupes
            const ss = require('string-similarity');
            let dupes = [];
            imports.forEach(function(clue) {

                // Loop through clues and only consider ones with 70%+ similarity as a true duplicate
                const numClues = clue.count;
                for (let i = 0; i < numClues; ++i) {
                    for (let n = i+1; n < numClues; ++n) {
                        const percMatch = ss.compareTwoStrings(clue.descriptions[i], clue.descriptions[n]);
                        if (percMatch >= reportThreshold) {
                            dupes.push({
                                date: clue._id.date,
                                externalId: clue._id.externalId,
                                percMatch: percMatch,
                                oldImportId: clue.importIds[i],
                                newImportId: clue.importIds[n],
                                oldDescription: clue.descriptions[i],
                                newDescription: clue.descriptions[n],
                            });
                        }
                    }
                }

            });

            // Loop through dupes, update the old one, and delete the new one
            let removed = [];
            let notRemoved = [];
            let manualReview = [];
            let removedIds = [];
            dupes.forEach(function(dupe) {

                // If this dupe is above the delete threshold, attempt it
                if (dupe.percMatch >= deleteThreshold) {

                    // Get the newer import
                    let didRemove = false;
                    const oldImportId = new Mongo.ObjectID(dupe.oldImportId.valueOf());
                    const newImportId = new Mongo.ObjectID(dupe.newImportId.valueOf());
                    const newImport = Imports.findOne(newImportId);

                    // Set fields to update the old import with
                    const doc = _.pick(
                        newImport,
                        'description',
                        'hint',
                        'thumbnail',
                        'imageUrl',
                        'latitude',
                        'longitude',
                        'externalUrl',
                        'moreInfo'
                    );
                    doc.updatedAt = new Date();

                    // Update the old import and delete the new one
                    const didUpdate = Imports.update(oldImportId, {$set: doc});
                    if (didUpdate) {
                        removedIds.push(newImportId.valueOf());
                        didRemove = Imports.remove(newImportId);
                    }

                    // Add the clue to the appropriate list depending on the outcome of the removal of the new one
                    if (didRemove) {
                        removed.push(dupe);
                    } else {
                        notRemoved.push(dupe);
                    }

                // Otherwise just report for manual review
                } else {
                    manualReview.push(dupe);
                }

            });

            // Loop through the buckets and output accordingly
            const groups = [
                {title: "DUPLICATE CLUES REMOVED", dupes: removed},
                {title: "DUPLICATE CLUES COULD NOT BE REMOVED", dupes: notRemoved},
                {title: "POSSIBLE DUPLICATE CLUES FOR MANUAL REVIEW", dupes: manualReview},
            ];
            groups.forEach(function(group) {
                out += group.title + " (" + group.dupes.length + ")" + hr();
                group.dupes.forEach(function(dupe) {
                    out += dupe.date + " [" + dupe.externalId + "]: " + (dupe.percMatch * 100).toFixed(2) + "%\n";
                    out += "[" + dupe.oldImportId + "] " + dupe.oldDescription + "\n";
                    out += "[" + dupe.newImportId + "] " + dupe.newDescription + "\n";
                    out += "\n";
                });
                out += "\n";
            });

            // Add a list of dupe IDs that were deleted at the end in case we need to manually delete
            out += "REMOVED THE FOLLOWING IMPORTS (" + removedIds.length + ")" + hr() + JSON.stringify(removedIds) + "\n\n";

            // Output the logs to STDOUT + a log file
            Logger.log(out, 3);
            const fs = require('fs');
            const dir = process.cwd() + '/../../../../../out/';
            const file = dir + 'dedupe_' + setId + '_' + new Date().getTime() + '.txt';
            fs.writeFile(file, out, (err) => {
                if (err) {
                    Logger.log(err, 3);
                } else {
                    Logger.log("Results output to " + file);
                }
            });

        },

        // Import Clues
        'importer.import'(setId, chunkSize = 1000) {

            check(setId, RecordId);
            check(chunkSize, Match.Integer);

            // Set the filter criteria on which imports to operate on
            const importSelector = {
                setId: setId,
                $or: [
                    {lastImportedAt: null},
                    {lastImportedAt: {$exists: false}},
                    {$expr: {$gt: ["$updatedAt" , "$lastImportedAt"]}},
                ],
            };

            // Set basic chunking math
            const total = Imports.find(importSelector).count();
            if (total == 0) {
                Logger.log('No clues to import for set ' + setId + '. Aborting.', 3);
                return;
            }
            const numChunks = Math.ceil(total / chunkSize);

            // Handle only adding the category on inserts
            const importSet = ImportSets.findOne(setId);
            const insertDoc = {categories: [importSet.categoryId]};

            // Loop through in chunks
            for (let i = 0; i < numChunks; ++i) {

                const start = i * chunkSize;
                const imports = Imports.find(
                    importSelector,
                    {
                        sort: {date: 1, description: 1},
                        skip: start,
                        limit: chunkSize,
                    }
                );

                Logger.log("Importing " + (start+1) + " - " + (start+imports.count()) + " of " + total + hr(), 3);
                imports.fetch().forEach(function(clue) {

                    const doc = _.pick(
                        clue,
                        'date',
                        'description',
                        'hint',
                        'thumbnail',
                        'imageUrl',
                        'latitude',
                        'longitude',
                        'externalUrl',
                        'externalId',
                        'moreInfo',
                    );

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

                    // Set the other defaults
                    doc.active = true;
                    doc.ownerId = null;
                    doc.createdAt = new Date();
                    doc.updatedAt = new Date();
                    doc.score = 10;
                    doc.difficulty = 0.5;
                    doc.approximation = false;

                    // Set the import ID
                    doc.importId = clue._id.valueOf();

                    // Get rid of 'null' strings
                    for (const attr in doc) {
                        if (
                            (typeof(doc[attr]) == 'string') &&
                            (
                                (doc[attr] == 'null') ||
                                (doc[attr].trim().length == 0)
                            )
                        ) {
                            doc[attr] = null;
                        }
                    }

                    // Import the clue
                    Clues.direct.upsert({importId: doc.importId}, {$set: doc, $setOnInsert: insertDoc}, {validate: false});

                    Logger.log(date.getUTCFullYear() + '-' + date.getUTCMonth() + '-' + date.getUTCDate() + ': ' + doc.description, 3);

                });

            }

            Imports.update(importSelector, {$set: {lastImportedAt: new Date()}}, {multi: true});
            Logger.log("Imported Set: " + importSet._id + "\n\n", 3);

        },

        // Preview the next import
        'importer.preview'(setId) {

            check(setId, RecordId);

            // Get the imports that will be updated vs inserted
            const updates = Imports.find({
                setId: setId,
                lastImportedAt: {$ne: null},
                $expr: {$gt: ["$updatedAt" , "$lastImportedAt"]},
            });
            const inserts = Imports.find({
                setId: setId,
                $or: [
                    {lastImportedAt: null},
                    {lastImportedAt: {$exists: false}},
                ],
            });

            const total = updates.count() + inserts.count();
            Logger.log("TOTAL UPSERTS: " + total + " (" + updates.count() + " updates + " + inserts.count() + " inserts)\n");

            const groups = [
                {title: "UPDATES", imports: updates},
                {title: "INSERTS", imports: inserts},
            ];
            groups.forEach(function(group) {
                Logger.log(group.title + " (" + group.imports.count() + ")" + hr());
                group.imports.forEach(function(clue) {
                    Logger.log(clue.date + ": " + clue.description + " [" + clue._id.valueOf() + "]");
                });
                Logger.log("\n");
            });

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

function hr() {
    return "\n" + "-".repeat(64) + "\n";
}