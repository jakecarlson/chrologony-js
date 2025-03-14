import SimpleSchema from "simpl-schema";

export const Schemas = {

    timestampable: new SimpleSchema({
        createdAt: {
            type: Date,
            autoValue() {
                if (this.isInsert) {
                    return new Date();
                }
                return undefined;
            },
            required: true,
        },
        updatedAt: {
            type: Date,
            autoValue() {
                return new Date();
            },
            required: true,
        },
    }),

    ownable(loose = false, optional = false) {

        let definition = {
            type: String,
            autoValue() {
                if (this.isInsert) {
                    return this.userId;
                }
                return undefined;
            },
            required: true,
        };

        if (loose) {
            definition.max = 17;
        } else {
            definition.regEx = SimpleSchema.RegEx.Id;
        }

        if (optional) {
            definition.optional = true;
        }

        return new SimpleSchema({
            ownerId: definition,
        });

    },

    endable: new SimpleSchema({
        startedAt: {
            type: Date,
            defaultValue: null,
            optional: true,
        },
        endedAt: {
            type: Date,
            defaultValue: null,
            optional: true,
        },
    }),

    softDeletable: new SimpleSchema({
        deletedAt: {
            type: Date,
            defaultValue: null,
            optional: true,
        },
    }),

    createIndexes(indexes) {
        indexes.forEach(function(attrs) {
            for (const name in attrs.indexes) {
                attrs.collection.rawCollection().createIndex(
                    attrs.indexes[name],
                    {
                        name: name,
                        background: true,
                    }
                );
            }
        });
    },

    dropIndexes(indexes) {
        indexes.forEach(function(attrs) {
            for (const name in attrs.indexes) {
                attrs.collection.rawCollection().dropIndex(name);
            }
        });
    },

};