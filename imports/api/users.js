import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

if (Meteor.isServer) {
    Meteor.publish('userData', function () {
        if (this.userId) {
            return Meteor.users.find({ _id: this.userId }, {
                fields: { currentRoomId: 1}
            });
        } else {
            this.ready();
        }
    });
}

Meteor.methods({

    // Update
    'user.update'(attrs) {

        check(attrs._id, String);
        check(attrs.currentRoomId, String);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        console.log('Update User: ' + attrs._id);
        console.log(attrs);

        // If there is an ID, this is an update
        return Meteor.users.update(
            {
                _id: attrs._id,
            },
            {
                $set: {
                    currentRoomId: attrs.currentRoomId,
                    updatedAt: new Date(),
                }
            }
        );

    },

});