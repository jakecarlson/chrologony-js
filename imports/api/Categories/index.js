import { Mongo } from 'meteor/mongo';

export const Categories = new Mongo.Collection('categories');

require('./constants');
require('./schema');
require('./helpers');
require('./publishers');
require('./methods');