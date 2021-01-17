import { Mongo } from 'meteor/mongo';

export const Turns = new Mongo.Collection('turns');

require('./constants');
require('./schema');
require('./helpers');
require('./publishers');
require('./methods');