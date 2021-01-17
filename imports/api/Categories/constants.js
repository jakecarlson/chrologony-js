import { Categories } from "./index";

Categories.PUBLISH_FIELDS = {
    _id: 1,
    name: 1,
    theme: 1,
    active: 1,
    private: 1,
    source: 1,
    collaborators: 1,
    ownerId: 1,
    precision: 1,
    cluesCount: 1,
    featured: 1,
};

Categories.DEFAULT_PRECISION = 'date';
Categories.DEFAULT_SOURCE = 'user';