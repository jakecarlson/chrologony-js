import { Meteor } from "meteor/meteor";
import SimpleSchema from "simpl-schema";
import { Schemas } from "../../modules/Schemas";

import { Games } from "./index";

Games.schema = new SimpleSchema({
    name: {type: String, max: 40, defaultValue: null, optional: true},
    password: {type: String, max: 72, defaultValue: null, optional: true},
    private: {type: Boolean, defaultValue: false, optional: true},
    categoryId: {type: String, regEx: SimpleSchema.RegEx.Id},
    currentTurnId: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
    currentRound: {type: Number, defaultValue: 1},
    currentLeaderId: {type: String, max: 17, defaultValue: null, optional: true},
    winnerId: {type: String, max: 17, defaultValue: null, optional: true},
    winPoints: {type: SimpleSchema.Integer, defaultValue: Games.DEFAULT_WIN_POINTS},
    equalTurns: {type: Boolean, defaultValue: false},
    minDifficulty: {type: Number, defaultValue: Games.MIN_DIFFICULTY},
    maxDifficulty: {type: Number, defaultValue: Games.MAX_DIFFICULTY},
    minScore: {type: SimpleSchema.Integer, defaultValue: Games.DEFAULT_MIN_SCORE},
    cardLimit: {type: SimpleSchema.Integer, defaultValue: 0},
    autoProceed: {type: Boolean, defaultValue: false},
    cardTime: {type: SimpleSchema.Integer, defaultValue: 0},
    turnOrder: {type: String, defaultValue: Games.DEFAULT_TURN_ORDER},
    recycleCards: {type: Boolean, defaultValue: false},
    showHints: {type: Boolean, defaultValue: false},
    displayPrecision: {type: String, defaultValue: Games.DEFAULT_PRECISION},
    comparisonPrecision: {type: String, defaultValue: Games.DEFAULT_PRECISION},
    playerLimit: {type: SimpleSchema.Integer, defaultValue: 0},
    noJoinAfterStart: {type: Boolean, defaultValue: false},
    autoShowMore: {type: Boolean, defaultValue: false},
    players: {type: Array, defaultValue: [], optional: true},
    'players.$': {type: String, max: 17},
});
Games.schema.extend(Schemas.ownable(true, true));
Games.schema.extend(Schemas.timestampable);
Games.schema.extend(Schemas.endable);
Games.schema.extend(Schemas.softDeletable);
Games.attachSchema(Games.schema);

if (Meteor.isServer) {
    Games.deny({
        insert() { return true; },
        remove() { return true; },
    });
}