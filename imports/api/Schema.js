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
        },
        updatedAt: {
            type: Date,
            autoValue() {
                return new Date();
            },
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
        },
    }),

};