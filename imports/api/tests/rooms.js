/* eslint-env mocha */

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { assert } from 'meteor/practicalmeteor:chai';

import { Rooms } from '../rooms.js';

if (Meteor.isServer) {
    describe('Rooms', () => {
        describe('methods', () => {
            const userId = Random.id();
            let roomId;

            beforeEach(() => {
                Rooms.remove({});
                roomId = Rooms.insert({
                    name: 'test room',
                    password: 'test password',
                    createdAt: new Date(),
                    owner: userId,
                    username: 'tmeasday',
                });
            });

        });
    });
}