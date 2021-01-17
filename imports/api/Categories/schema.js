import SimpleSchema from "simpl-schema";
import { Schemas } from "../../modules/Schemas";

import { Categories } from "./index";

Categories.schema = new SimpleSchema({
    name: {type: String, max: 80},
    active: {type: Boolean, defaultValue: false},
    private: {type: Boolean, defaultValue: true},
    theme: {type: String, max: 40},
    source: {type: String, max: 40, defaultValue: Categories.DEFAULT_SOURCE},
    collaborators: {type: Array, defaultValue: [], optional: true},
    'collaborators.$': {type: String, regEx: SimpleSchema.RegEx.Id},
    precision: {type: String, defaultValue: Categories.DEFAULT_PRECISION},
    cluesCount: {type: SimpleSchema.Integer, defaultValue: 0, optional: true},
    featured: {type: Boolean, defaultValue: false},
    featuredStartedAt: {type: Date, defaultValue: null},
    featuredEndedAt: {type: Date, defaultValue: null},
});
Categories.schema.extend(Schemas.timestampable);
Categories.schema.extend(Schemas.ownable());
Categories.attachSchema(Categories.schema);

// Collection hooks
Categories.after.insert(function(id, category) {
    Logger.auditCreate('Categories', id, category);
});
Categories.after.update(function(id, category) {
    Logger.auditUpdate('Categories', id, this.previous, category, ['clueCount']);
});
Categories.after.remove(function(id, category) {
    Logger.auditDelete('Categories', id);
});