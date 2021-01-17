import { Mongo } from 'meteor/mongo';

export const Clues = new Mongo.Collection('clues');

require('./constants');
require('./schema');
require('./helpers');
require('./publishers');
require('./methods');