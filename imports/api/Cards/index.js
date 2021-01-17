import { Mongo } from 'meteor/mongo';

export const Cards = new Mongo.Collection('cards');

require('./constants');
require('./schema');
require('./helpers');
require('./publishers');
require('./methods');