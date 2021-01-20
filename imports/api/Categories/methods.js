import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { NonEmptyString, RecordId } from "../../startup/validations";
import { Permissions } from '../../modules/Permissions';
import { Promise } from "meteor/promise";

import { Games } from "../Games";
import { Clues } from "../Clues";
import { Categories } from "./index";

Meteor.methods({

    // Insert
    'category.create'(attrs) {

        check(
            attrs,
            {
                name: NonEmptyString,
                theme: NonEmptyString,
                precision: NonEmptyString,
                private: Boolean,
                active: Boolean,
            }
        );
        Permissions.authenticated();
        Permissions.notGuest();
        Permissions.check(Games.PRECISION_OPTIONS.includes(attrs.precision));

        Logger.log('Insert Category: ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        try {
            return Categories.insert({
                name: attrs.name,
                theme: attrs.theme,
                precision: attrs.precision,
                private: attrs.private,
                active: attrs.active,
            });
        } catch(err) {
            throw new Meteor.Error('category-not-inserted', 'Could not create a category.', err);
        }

    },

    // Update
    'category.update'(attrs) {

        check(
            attrs,
            {
                _id: RecordId,
                name: NonEmptyString,
                theme: NonEmptyString,
                precision: NonEmptyString,
                private: Boolean,
                active: Boolean,
            }
        );
        Permissions.authenticated();
        Permissions.notGuest();
        Permissions.owned(Categories.findOne(attrs._id));
        Permissions.check(Games.PRECISION_OPTIONS.includes(attrs.precision));

        Logger.log('Update Category: ' + attrs._id + ' ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        const updated = Categories.update(
            {
                _id: attrs._id,
                ownerId: Meteor.userId(),
            },
            {
                $set: {
                    name: attrs.name,
                    theme: attrs.theme,
                    precision: attrs.precision,
                    private: attrs.private,
                    active: attrs.active,
                }
            }
        );
        if (!updated) {
            throw new Meteor.Error('category-not-updated', 'Could not update a category.');
        }

        return updated;

    },

    // Collaborators
    'category.setCollaborators'(id, collaborators) {

        check(id, RecordId);
        check(collaborators, [RecordId]);
        Permissions.authenticated();
        Permissions.notGuest();
        Permissions.owned(Categories.findOne(id));

        Logger.log('Update Category Collaborators: ' + id + ' ' + JSON.stringify(collaborators));

        this.unblock();

        // Get added and removed collaborators
        const category = Categories.findOne(id);
        const previousCollaborators = category.collaborators;

        // Update the category collaborators
        const updated = Categories.update(
            {
                _id: id,
                ownerId: Meteor.userId(),
            },
            {
                $set: {
                    collaborators: collaborators,
                }
            }
        );
        if (!updated) {
            throw new Meteor.Error('category-not-updated', 'Could not set collaborators on a category.');
        }

        // Send out emails informing users of the invitations / disinvitation
        const addedCollaborators = _.difference(collaborators, previousCollaborators);
        const removedCollaborators = _.difference(previousCollaborators, collaborators);
        addedCollaborators.forEach(function(userId) {
            sendCollaboratorEmail(category, userId, 'add');
        });
        removedCollaborators.forEach(function(userId) {
            sendCollaboratorEmail(category, userId, 'remove');
        });

        return collaborators.length;

    },

    // Delete
    'category.remove'(id) {

        check(id, RecordId);
        Permissions.authenticated();
        Permissions.notGuest();
        Permissions.owned(Categories.findOne(id));

        Logger.log('Delete Category: ' + id);

        // Remove the item
        const removed = Categories.remove(
            {
                _id: id,
                ownerId: Meteor.userId(),
            }
        );
        if (!removed) {
            throw new Meteor.Error('category-not-removed', 'Could not remove a category.');
        }

        return removed;

    },

    'category.updateClueCounts'(ids) {

        check(ids, Match.OneOf(RecordId, [RecordId]));
        Permissions.authenticated();
        Permissions.notGuest();

        if (typeof(ids) == 'string') {
            ids = [ids];
        }
        ids.forEach(function(id) {
            const cluesCount = Clues.find({categories: id, active: true}).count();
            try {
                const updated = Categories.update(id, {$set: {cluesCount: cluesCount}});
            } catch (err) {
                throw new Meteor.Error('category-not-updated', 'Could not update clue count for a category.', err);
            }
        });

        return ids.length;

    }

});

if (Meteor.isServer) {

    Meteor.methods({

        // Search
        'category.search'(query, excludeIds = [], includeNotOwned = false) {

            if (typeof(excludeIds) == 'string') {
                excludeIds = [excludeIds];
            }

            check(query, String);
            check(excludeIds, [RecordId]);
            Permissions.authenticated();
            Permissions.notGuest();

            let selector = {
                $and: [
                    Helpers.getCategoriesSelector({exclude: excludeIds, editor: !includeNotOwned}),
                ],
            };
            if (query.length > 0) {
                selector.$and.push({$text: {$search: query}});
            }

            return Categories.find(
                selector,
                {
                    sort: getSort(),
                }
            ).fetch();

        },

        // Get
        'category.get'(ids = []) {

            if (typeof(ids) == 'string') {
                ids = [ids];
            }

            check(ids, [RecordId]);
            Permissions.authenticated();
            Permissions.notGuest();

            let selector = Helpers.getCategoriesSelector();
            selector._id = {$in: ids};
            return Categories.find(
                selector,
                {
                    sort: getSort(),
                }
            ).fetch();
        },

        // Set Featured
        'category.setFeatured'(num = 3, source = null) {

            check(num, Match.Integer);

            // Get 3 randomly selected categories
            let selector = {
                featured: false,
                private: false,
                source: (source) ? source : {$ne: 'user'},
            };
            const possibleCategories = Promise.await(
                Categories.rawCollection().aggregate(
                    [
                        {$match: selector},
                        {$sample: {size: num}},
                    ]
                ).toArray()
            );
            let featuredIds = [];
            possibleCategories.forEach(function(category) {
                featuredIds.push(category._id);
            });

            // Get all currently featured categories and stop featuring them
            const unfeatured = Categories.update({featured: true}, {$set: {featured: false, featuredEndedAt: new Date()}}, {multi: true});
            Logger.log('Stopped Featuring ' + unfeatured + ' categories');

            // Set the new categories to featured
            const featured = Categories.update({_id: {$in: featuredIds}}, {$set: {featured: true, featuredStartedAt: new Date()}}, {multi: true});
            Logger.log('Started Featuring ' + unfeatured + ' categories');

        },

    });

}

function getSort() {
    return {theme: 1, name: 1};
}

function sendCollaboratorEmail(category, userId, action, text) {

    Logger.audit(
        action + 'Collaborator',
        {
            collection: 'Categories',
            documentId: category._id,
            attrs: {userId: userId}
        }
    );

    const user = Meteor.users.findOne(userId);
    if (user && user.email()) {

        const collaborator = Helpers.renderHtmlEmail({
            subject: Meteor.settings.public.app.collaborator[action].subject,
            preview: Meteor.settings.public.app.collaborator[action].preview,
            template: 'category_collaborator_' + action,
            data: {
                collaborator: user.name(),
                inviter: Meteor.user().name(),
                title: category.name,
                url: category.cluesLink(),
            },
        });

        Email.send({
            from: Meteor.settings.public.app.sendEmail,
            to: user.email(),
            subject: Meteor.settings.public.app.collaborator[action].subject,
            text: collaborator.text,
            html: collaborator.html,
        });

    }

}