/* eslint-env mocha */

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { assert } from 'meteor/practicalmeteor:chai';

import { Games } from '../Games.js';

if (Meteor.isServer) {
    describe('Games', () => {
        describe('methods', () => {
            const userId = Random.id();
            let gameId;

            beforeEach(() => {
                Games.remove({});
                gameId = Games.insert({
                    name: 'test game',
                    password: 'test password',
                    createdAt: new Date(),
                    ownerId: userId,
                    username: 'tmeasday',
                });
            });

        });
    });
}