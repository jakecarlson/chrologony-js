import { Meteor } from 'meteor/meteor';

import { Categories } from "./index";

if (Meteor.isServer) {

    Meteor.publish('categories', function categoriesPublication() {
        if (this.userId) {
            return Categories.find(
                Helpers.getCategoriesSelector({active: false}),
                {
                    fields: Categories.PUBLISH_FIELDS,
                }
            );
        } else {
            return this.ready();
        }
    });

    Meteor.publish('cluesCategory', function cluesCategoryPublication(categoryId) {
        if (this.userId) {
            return Categories.find(
                Helpers.getCategoriesSelector({active: false, include: categoryId}),
                {
                    fields: Categories.PUBLISH_FIELDS,
                }
            );
        } else {
            return this.ready();
        }
    });

    Meteor.publish('featuredCategories', function featuredCategoriesPublication() {
        if (this.userId) {
            const categories = Categories.find(
                {featured: true, private: false, active: true},
                {
                    fields: Categories.PUBLISH_FIELDS,
                }
            );
            return categories;
        } else {
            return this.ready();
        }
    });

}