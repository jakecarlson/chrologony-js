import { Meteor } from 'meteor/meteor';

if (Meteor.isServer) {

    // Additional user data
    Meteor.publish('userData', function () {
        if (this.userId) {
            return Meteor.users.find(
                {
                    _id: this.userId,
                },
                {
                    fields: Meteor.users.SELECT_FIELDS,
                }
            );
        } else {
            this.ready();
        }
    });

    // Get the players in the room
    Meteor.publish('players', function playersPublication(userIds) {
        if (this.userId && userIds) {
            return Meteor.users.find(
                {
                    _id: {$in: userIds},
                },
                {
                    fields: Meteor.users.SELECT_FIELDS,
                }
            );
        } else {
            return this.ready();
        }
    });

}