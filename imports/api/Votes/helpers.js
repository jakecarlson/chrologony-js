import { Meteor } from 'meteor/meteor';

import { Clues } from "../Clues";
import { Votes } from "./index";

Votes.helpers({

    clue() {
        return Clues.findOne(this.clueId);
    },

    owner() {
        return Meteor.users.findOne(this.ownerId);
    },

});