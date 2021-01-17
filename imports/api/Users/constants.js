import { Meteor } from 'meteor/meteor';

Meteor.users.ONLINE_THRESHOLD = 15 * 60 * 1000; // Set to 15m
Meteor.users.DEFAULT_PAGE_SIZE = 25;

Meteor.users.SELECT_FIELDS = {
    _id: 1,
    'profile.name': 1,
    'profile.muted': 1,
    'profile.pageSize': 1,
    currentGameId: 1,
    joinedGameAt: 1,
    lastLoggedInAt: 1,
    lastActiveAt: 1,
    guest: 1,
};