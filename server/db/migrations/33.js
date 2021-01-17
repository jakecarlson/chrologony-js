import { Schemas } from "../../../imports/modules/Schemas";
import { ImportSets } from '../importer';
import { Imports } from '../importer';

const INDEXES = [

    {
        collection: ImportSets,
        indexes: {
            active: {
                active: 1,
            },
            sort: {
                createdAt: 1,
            },
        },
    },

    {
        collection: Imports,
        indexes: {
            notImported: {
                setId: 1,
                updatedAt: 1,
                lastImportedAt: 1,
            },
            sort: {
                date: 1,
                description: 1,
            }
        },
    },

];

// Add importer indexes to increase import performance.
Migrations.add({

    version: 33,
    name: 'Add importer indexes to increase import performance.',

    up: function() {
        ImportSets.rawCollection().dropIndex('status');
        Schemas.createIndexes(INDEXES);
    },

    down: function() {
        Schemas.dropIndexes(INDEXES);
    }

});