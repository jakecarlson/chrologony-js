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

    ownable: new SimpleSchema({
        ownerId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
            autoValue() {
                if (this.isInsert) {
                    return this.userId;
                }
                return undefined;
            },
            // required: true,
            optional: true,
        },
        owner: {type: String, regEx: SimpleSchema.RegEx.Id, optional: true},
    }),

    endable: new SimpleSchema({
        startedAt: {
            type: Date,
            autoValue() {
                if (this.isInsert) {
                    return new Date();
                }
                return undefined;
            },
            required: true,
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

};