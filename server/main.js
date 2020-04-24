import { Meteor } from 'meteor/meteor';
import '../imports/api/users.js';
import '../imports/api/cards.js';
import '../imports/api/games.js';
import '../imports/api/rooms.js';
import '../imports/api/clues.js';
import '../imports/api/categories.js';
import '../imports/api/turns.js';

Meteor.startup(() => {
  // code to run on server at startup
});

/*
Meteor.publish('Meteor.users.currentRoomId', function ({ userIds }) {

    // Validate the arguments to be what we expect
    new SimpleSchema({
        userIds: { type: [String] }
    }).validate({ userIds });

    // Select only the users that match the array of IDs passed in
    const selector = {
        _id: { $in: userIds }
    };

    // Only return one field, `initials`
    const options = {
        fields: { currentRoomId: 1 }
    };

    return Meteor.users.find(selector, options);

});
 */