import SimpleSchema from "simpl-schema";

export const Schema = {

    timestamps: new SimpleSchema({
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

    owned: new SimpleSchema({
        owner: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
            autoValue() {
                if (this.isInsert) {
                    return this.userId;
                }
                return undefined;
            },
            required: true,
        },
    }),

};