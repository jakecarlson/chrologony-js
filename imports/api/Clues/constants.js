import { Clues } from "./index";

Clues.DEFAULT_SCORE = 10;
Clues.DEFAULT_DIFFICULTY = .5;
Clues.DEFAULT_TIMEZONE = 'UTC';
Clues.PUBLISH_FIELDS = {
    _id: 1,
    description: 1,
    date: 1,
    timeZone: 1,
    active: 1,
    open: 1,
    categories: 1,
    ownerId: 1,
    score: 1,
    difficulty: 1,
    hint: 1,
    thumbnailUrl: 1,
    imageUrl: 1,
    latitude: 1,
    longitude: 1,
    externalId: 1,
    externalUrl: 1,
    moreInfo: 1,
    approximation: 1,
};