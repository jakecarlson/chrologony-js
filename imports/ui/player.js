import { Template } from 'meteor/templating';

import './player.html';

Template.player.onCreated(function playerOnCreated() {

});

Template.player.helpers({
    isTurnOwner() {
        return (this.turn && (this.turn.userId == this.player._id));
    },
    id() {
        return this.player.id;
    },
    username() {
        return this.player.username;
    }
});

Template.player.events({

});