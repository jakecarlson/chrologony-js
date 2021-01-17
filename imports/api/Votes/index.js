import { Mongo } from 'meteor/mongo';

export const Votes = new Mongo.Collection('votes');

require('./constants');
require('./schema');
require('./helpers');
require('./publishers');
require('./methods');