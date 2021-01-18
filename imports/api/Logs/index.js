import { Mongo } from 'meteor/mongo';

export const Logs = new Mongo.Collection('logs');

require('./schema');
require('./helpers');
require('./methods');