import { Categories } from '../../../imports/api/Categories';
import { Clues } from '../../../imports/api/Clues';

// Add space exploration history Wikipedia category.
const categoryName = 'Wikipedia: Space Exploration';
Migrations.add({

    version: 6,
    name: 'Add space exploration history Wikipedia category.',

    up: function() {

        const wotdCategory = Categories.findOne({ownerId: null, source: 'wikipedia'}, {sort: {createdAt: 1}});
        if (wotdCategory) {

            const wotdCategoryId = wotdCategory._id;

            const categoryId = Categories.insert({
                name: categoryName,
                theme: 'History',
                private: false,
                active: true,
                source: 'wikipedia',
                collaborators: [],
                ownerId: null,
            });

            const selector = {
                $and: [
                    {categories: wotdCategoryId},
                    {
                        $or: [
                            {description: {$regex: 'space', $options: 'i'}},
                            {description: {$regex: 'nasa', $options: 'i'}},
                            {description: {$regex: 'orbit', $options: 'i'}},
                            {description: {$regex: 'astronaut', $options: 'i'}},
                            {description: {$regex: 'cosmonaut', $options: 'i'}},
                            {
                                externalId: {
                                    $in: [
                                        'Q41291',
                                        'Q334465',
                                        'Q15180',
                                        'Q46611',
                                        'Q282184',
                                        'Q622762',
                                        'Q1656530',
                                        'Q734306',
                                        'Q334465',
                                        'Q208231',
                                        'Q494204',
                                        'Q1816481',
                                        'Q18822',
                                        'Q15180',
                                        'Q751873',
                                        'Q49541',
                                        'Q213498',
                                        'Q49044',
                                        'Q14554285',
                                    ],
                                },
                            },
                        ],
                    },
                    {
                        externalId: {
                            $nin: [
                                'Q229438',
                                'Q2550247',
                                'Q79477',
                                'Q11223',
                                'Q815436',
                                'Q8683',
                                'Q15180',
                                'Q1583411',
                                'Q162066',
                                'Q918733',
                                'Q2009640',
                                'Q67',
                                'Q4354880',
                                'Q748010',
                                'Q1138406',
                                'Q556',
                                'Q2199',
                                'Q2517983',
                                'Q2199',
                                'Q110869',
                                'Q339',
                                'Q44559',
                                'Q242309',
                                'Q16741',
                                'Q193',
                                'Q319',
                                'Q178765',
                            ],
                        },
                    },
                ],
            };

            const updated = Clues.update(
                selector,
                {$push: {categories: categoryId}},
                {multi: true}
            );
            Logger.log("Created category 'Space Exploration' (" + categoryId + ") and associated " + updated + " clues.", 3);

        }

    },

    down: function() {

        const wotdCategory = Categories.findOne({ownerId: null, source: 'wikipedia'}, {sort: {createdAt: 1}});
        if (wotdCategory) {
            const category = Categories.find({name: categoryName, ownerId: null, source: 'wikipedia'}, {sort: {createdAt: 1}}).fetch();
            const updated = Clues.update(
                {categories: category._id},
                {$pull: {categories: category._id}},
                {multi: true}
            );
            Categories.remove(category._id);
            Logger.log("Removed category '" + category.name + "' (" + category._id + ") and disassociated " + updated + " clues.", 3);
        }

    },

});