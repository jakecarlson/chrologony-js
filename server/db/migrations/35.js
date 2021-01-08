import { Schemas } from "../../../imports/modules/Schemas";
import { Categories } from '../../../imports/api/Categories';

const INDEXES = [

    {
        collection: Categories,
        indexes: {
            search: {
                name: "text",
                theme: "text",
                source: "text",
            },
            import: {
                name: 1,
                source: 1,
            },
        },
    },

];

// Add text search to categories.
Migrations.add({

    version: 35,
    name: 'Add text search to categories.',

    up: function() {
        Categories.rawCollection().dropIndex('source');
        Categories.rawCollection().dropIndex('search');
        Schemas.createIndexes(INDEXES);
    },

    down: function() {
        Schemas.dropIndexes(INDEXES);
    }

});