import { Mongo } from 'meteor/mongo';
import SimpleSchema from "simpl-schema";
import { Schemas } from "../modules/Schemas";

import './Users';

export const Rooms = new Mongo.Collection('rooms');

Rooms.schema = new SimpleSchema({
    name: {type: String, max: 40},
    password: {type: String, max: 72},
    currentGameId: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
});
Rooms.schema.extend(Schemas.timestampable);
Rooms.schema.extend(Schemas.ownable());
Rooms.schema.extend(Schemas.softDeletable);
Rooms.attachSchema(Rooms.schema);