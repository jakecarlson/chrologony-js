import { Categories } from '../../../imports/api/Categories';
import { Clues } from '../../../imports/api/Clues';

// Add more Wikipedia On This Day categories.
Migrations.add({

    version: 4,
    name: 'Add more Wikipedia On This Day categories.',

    up: function() {

        const wotdCategory = Categories.findOne({ownerId: null, source: 'wikipedia'}, {sort: {createdAt: 1}});
        if (wotdCategory) {

            const wotdCategoryId = wotdCategory._id;
            const newCategories = [

                // Conflicts
                {
                    name: 'American Revolution',
                    theme: 'Conflicts',
                    selector: false,
                },
                {
                    name: 'American Civil War',
                    theme: 'Conflicts',
                    selector: false,
                },
                {
                    name: 'World War I',
                    theme: 'Conflicts',
                    selector: false,
                },
                {
                    name: 'World War II',
                    theme: 'Conflicts',
                    selector: false,
                },
                {
                    name: 'Korean War',
                    theme: 'Conflicts',
                    selector: false,
                },
                {
                    name: 'Vietnam War',
                    theme: 'Conflicts',
                    selector: false,
                },
                {
                    name: 'Cold War',
                    theme: 'Conflicts',
                    selector: false,
                },

                // Nations & Empires
                {
                    name: 'Roman Empire',
                    theme: 'History',
                    selector: {
                        $and: [
                            {
                                $or: [
                                    {description: {$regex: 'roman', $options: 'i'}},
                                    {description: {$regex: 'rome', $options: 'i'}}
                                ]
                            },
                            {description: {$not: {$regex: 'romania', $options: 'i'}}},
                            {date: {$lt: new Date('0500-01-01')}}
                        ]
                    },
                },
                {
                    name: 'Byzantine Empire',
                    theme: 'History',
                    selector: {description: {$regex: 'byzant', $options: 'i'}},
                },
                {
                    name: 'Jewish History',
                    theme: 'History',
                    selector: {
                        $or: [
                            {description: {$regex: 'israel', $options: 'i'}},
                            {description: {$regex: 'jew', $options: 'i'}},
                            {description: {$regex: 'hebrew', $options: 'i'}}
                        ]
                    }
                },
                {
                    name: 'Chinese History',
                    theme: 'History',
                    selector: {description: {$regex: /chin[a|e]/, $options: 'i'}},
                },
                {
                    name: 'Egyptian History',
                    theme: 'History',
                    selector: {description: {$regex: 'egypt', $options: 'i'}},
                },
                {
                    name: 'Indian History',
                    theme: 'History',
                    selector: {description: {$regex: 'india', $options: 'i'}},
                },

                // Sports
                {
                    name: 'Sports',
                    theme: 'Sports',
                    selector: {
                        $or: [
                            {description: {$regex: 'kayak', $options: 'i'}},
                            {description: {$regex: 'bobsleigh', $options: 'i'}},
                            {description: {$regex: 'canoeing', $options: 'i'}},
                            {description: {$regex: 'cross-country skiing', $options: 'i'}},
                            {description: {$regex: 'rafting', $options: 'i'}},
                            {description: {$regex: 'skibob', $options: 'i'}},
                            {description: {$regex: 'surfing', $options: 'i'}},
                            {description: {$regex: 'swimming', $options: 'i'}},
                            {description: {$regex: 'bodyboarding', $options: 'i'}},
                            {description: {$regex: 'diving', $options: 'i'}},
                            {description: {$regex: 'freediving', $options: 'i'}},
                            {description: {$regex: 'paddleboarding', $options: 'i'}},
                            {description: {$regex: 'rowing', $options: 'i'}},
                            {description: {$regex: 'scuba diving', $options: 'i'}},
                            {description: {$regex: 'synchronized swimming', $options: 'i'}},
                            {description: {$regex: 'aerobics', $options: 'i'}},
                            {description: {$regex: 'aikido', $options: 'i'}},
                            {description: {$regex: 'archery', $options: 'i'}},
                            {description: {$regex: 'artistic gymnastics', $options: 'i'}},
                            {description: {$regex: 'baton twirling', $options: 'i'}},
                            {description: {$regex: 'bodybuilding', $options: 'i'}},
                            {description: {$regex: 'boxing', $options: 'i'}},
                            {description: {$regex: 'cross-country equestrianism', $options: 'i'}},
                            {description: {$regex: 'cross-country running', $options: 'i'}},
                            {description: {$regex: 'cycling', $options: 'i'}},
                            {description: {$regex: 'discus throw', $options: 'i'}},
                            {description: {$regex: 'equestrian', $options: 'i'}},
                            {description: {$regex: 'fencing', $options: 'i'}},
                            {description: {$regex: 'figure skating', $options: 'i'}},
                            {description: {$regex: 'horse racing', $options: 'i'}},
                            {description: {$regex: 'judo', $options: 'i'}},
                            {description: {$regex: 'karate', $options: 'i'}},
                            {description: {$regex: 'kendo', $options: 'i'}},
                            {description: {$regex: 'kickboxing', $options: 'i'}},
                            {description: {$regex: 'kung fu', $options: 'i'}},
                            {description: {$regex: 'long jump', $options: 'i'}},
                            {description: {$regex: 'marathon', $options: 'i'}},
                            {description: {$regex: 'mixed martial arts', $options: 'i'}},
                            {description: {$regex: 'Muay Thai', $options: 'i'}},
                            {description: {$regex: 'pole vault', $options: 'i'}},
                            {description: {$regex: 'powerlifting', $options: 'i'}},
                            {description: {$regex: 'sumo', $options: 'i'}},
                            {description: {$regex: 'sword-fighting', $options: 'i'}},
                            {description: {$regex: 'trampolining', $options: 'i'}},
                            {description: {$regex: 'tumbling', $options: 'i'}},
                            {description: {$regex: 'weightlifting', $options: 'i'}},
                            {description: {$regex: 'wrestling', $options: 'i'}},
                            {description: {$regex: 'baseball', $options: 'i'}},
                            {description: {$regex: 'basketball', $options: 'i'}},
                            {description: {$regex: 'tennis', $options: 'i'}},
                            {description: {$regex: 'badminton', $options: 'i'}},
                            {description: {$regex: 'bowling', $options: 'i'}},
                            {description: {$regex: 'cricket', $options: 'i'}},
                            {description: {$regex: 'curling', $options: 'i'}},
                            {description: {$regex: 'dodgeball', $options: 'i'}},
                            {description: {$regex: 'football', $options: 'i'}},
                            {description: {$regex: 'golf', $options: 'i'}},
                            {description: {$regex: 'handball', $options: 'i'}},
                            {description: {$regex: 'hockey', $options: 'i'}},
                            {description: {$regex: 'horseball', $options: 'i'}},
                            {description: {$regex: 'hurling', $options: 'i'}},
                            {description: {$regex: 'ice hockey', $options: 'i'}},
                            {description: {$regex: 'kickball', $options: 'i'}},
                            {description: {$regex: 'lacrosse', $options: 'i'}},
                            {description: {$regex: 'paddle', $options: 'i'}},
                            {description: {$regex: 'polo', $options: 'i'}},
                            {description: {$regex: 'racquetball', $options: 'i'}},
                            {description: {$regex: 'rinkball', $options: 'i'}},
                            {description: {$regex: 'rounders', $options: 'i'}},
                            {description: {$regex: 'rugby', $options: 'i'}},
                            {description: {$regex: 'soccer', $options: 'i'}},
                            {description: {$regex: 'softball', $options: 'i'}},
                            {description: {$regex: 'squash', $options: 'i'}},
                            {description: {$regex: 'table tennis', $options: 'i'}},
                            {description: {$regex: 'basketball', $options: 'i'}},
                            {description: {$regex: 'handball', $options: 'i'}},
                            {description: {$regex: 'hockey', $options: 'i'}},
                            {description: {$regex: 'mintonette', $options: 'i'}},
                            {description: {$regex: 'water polo', $options: 'i'}},
                            {description: {$regex: 'base jumping', $options: 'i'}},
                            {description: {$regex: 'abseiling', $options: 'i'}},
                            {description: {$regex: 'bouldering', $options: 'i'}},
                            {description: {$regex: 'gliding', $options: 'i'}},
                            {description: {$regex: 'kiteboarding', $options: 'i'}},
                            {description: {$regex: 'kitesurfing', $options: 'i'}},
                            {description: {$regex: 'parachuting', $options: 'i'}},
                            {description: {$regex: 'paragliding', $options: 'i'}},
                            {description: {$regex: 'parasailing', $options: 'i'}},
                            {description: {$regex: 'skateboarding', $options: 'i'}},
                            {description: {$regex: 'skydiving', $options: 'i'}},
                            {description: {$regex: 'skysurfing', $options: 'i'}},
                            {description: {$regex: 'snowboarding', $options: 'i'}},
                            {description: {$regex: 'wakeboarding', $options: 'i'}},
                            {description: {$regex: 'windsurfing', $options: 'i'}},
                            {description: {$regex: 'cross-country cycling', $options: 'i'}},
                            {description: {$regex: 'hiking', $options: 'i'}},
                            {description: {$regex: 'mountaineering', $options: 'i'}},
                            {description: {$regex: 'drifting', $options: 'i'}},
                            {description: {$regex: 'formula racing', $options: 'i'}},
                            {description: {$regex: 'kart racing', $options: 'i'}},
                            {description: {$regex: 'rallycross', $options: 'i'}},
                            {description: {$regex: 'airsoft', $options: 'i'}},
                            {description: {$regex: 'aquathlon', $options: 'i'}},
                            {description: {$regex: 'ballooning', $options: 'i'}},
                            {description: {$regex: 'barrel racing', $options: 'i'}},
                            {description: {$regex: 'biathlon', $options: 'i'}},
                            {description: {$regex: 'capoeira', $options: 'i'}},
                            {description: {$regex: 'cheerleading', $options: 'i'}},
                            {description: {$regex: 'dancing', $options: 'i'}},
                            {description: {$regex: 'darts', $options: 'i'}},
                            {description: {$regex: 'decathlon', $options: 'i'}},
                            {description: {$regex: 'foosball', $options: 'i'}},
                            {description: {$regex: 'gymkhana', $options: 'i'}},
                            {description: {$regex: 'heptathlon', $options: 'i'}},
                            {description: {$regex: 'jogging', $options: 'i'}},
                            {description: {$regex: 'laser tag', $options: 'i'}},
                            {description: {$regex: 'paintball', $options: 'i'}},
                            {description: {$regex: 'parkour', $options: 'i'}},
                            {description: {$regex: 'petanque', $options: 'i'}},
                            {description: {$regex: 'triathlon', $options: 'i'}},
                            {description: {$regex: 'olympic', $options: 'i'}},
                        ],
                    },
                },

                // Time Periods
                {
                    name: 'Ancient History',
                    theme: 'History',
                    selector: {date: {$lte: new Date('0500-01-01')}},
                },
                {
                    name: 'Middle Ages',
                    theme: 'History',
                    selector: {$and: [{date: {$gte: new Date('0500-01-01')}}, {date: {$lte: new Date('1500-01-01')}}]},
                },
                {
                    name: 'Early Modern Period',
                    theme: 'History',
                    selector: {$and: [{date: {$gte: new Date('1500-01-01')}}, {date: {$lte: new Date('1800-01-01')}}]},
                },
                {
                    name: 'Late Modern Period',
                    theme: 'History',
                    selector: {$and: [{date: {$gte: new Date('1750-01-01')}}, {date: {$lte: new Date('1915-01-01')}}]},
                },
                {
                    name: 'Interwar Period',
                    theme: 'History',
                    selector: {$and: [{date: {$gte: new Date('1915-01-01')}}, {date: {$lte: new Date('1946-01-01')}}]},
                },
                {
                    name: 'Contemporary Period',
                    theme: 'History',
                    selector: {date: {$gte: new Date('1946-01-01')}},
                },

            ];

            // Loop through
            newCategories.forEach(function (category) {

                const categoryId = Categories.insert({
                    name: 'Wikipedia: ' + category.name,
                    theme: category.theme,
                    private: false,
                    active: true,
                    source: 'wikipedia',
                    collaborators: [],
                    ownerId: null,
                });

                if (!category.selector) {
                    category.selector = {description: {$regex: category.name, $options: 'i'}};
                }
                category.selector.categories = wotdCategoryId;

                const updated = Clues.update(
                    category.selector,
                    {$push: {categories: categoryId}},
                    {multi: true}
                );
                Logger.log("Created category '" + category.name + "' (" + categoryId + ") and associated " + updated + " clues.", 3);

            });
        }

    },

    down: function() {

        const wotdCategory = Categories.findOne({ownerId: null, source: 'wikipedia'}, {sort: {createdAt: 1}});
        if (wotdCategory) {
            const newCategories = Categories.find({ownerId: null, source: 'wikipedia', _id: {$ne: wotdCategory._id}}, {sort: {createdAt: 1}}).fetch();
            newCategories.forEach(function(category) {
                const updated = Clues.update(
                    {categories: category._id},
                    {$pull: {categories: category._id}},
                    {multi: true}
                );
                Categories.remove(category._id);
                Logger.log("Removed category '" + category.name + "' (" + category._id + ") and disassociated " + updated + " clues.", 3);
            });
        }

    },

});