import { Mongo } from 'meteor/mongo';

export const Games = new Mongo.Collection('games');

require('./constants');
require('./schema');
require('./helpers');
require('./publishers');
require('./methods');