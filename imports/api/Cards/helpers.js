import { Meteor } from 'meteor/meteor';

import { Games } from "../Games";
import { Clues } from "../Clues";
import { Turns } from "../Turns";
import { Cards } from "./index";

Cards.helpers({

    game() {
        return Games.findOne(this.gameId);
    },

    turn() {
        return Turns.findOne(this.turnId);
    },

    clue() {
        return Clues.findOne(this.clueId);
    },

    owner() {
        return Meteor.users.findOne(this.ownerId);
    },

});