import { Games } from "./index";

Games.PRECISION_OPTIONS = [
    'second',
    'minute',
    'hour',
    'date',
    'month',
    'year',
    'decade',
    'century',
    'millennium',
];

Games.PUBLISH_FIELDS = {
    _id: 1,
    name: 1,
    private: 1,
    password: 1,
    ownerId: 1,
    categoryId: 1,
    currentTurnId: 1,
    currentRound: 1,
    currentLeaderId: 1,
    winnerId: 1,
    createdAt: 1,
    startedAt: 1,
    endedAt: 1,
    winPoints: 1,
    turnOrder: 1,
    minScore: 1,
    minDifficulty: 1,
    maxDifficulty: 1,
    equalTurns: 1,
    recycleCards: 1,
    cardLimit: 1,
    autoProceed: 1,
    cardTime: 1,
    showHints: 1,
    comparisonPrecision: 1,
    displayPrecision: 1,
    playerLimit: 1,
    noJoinAfterStart: 1,
    autoShowMore: 1,
    players: 1,
    token: 1,
};

Games.TURN_ORDER_OPTIONS = [

];

Games.DEFAULT_TURN_ORDER = 'sequential';
Games.DEFAULT_PRECISION = 'date';
Games.DEFAULT_MIN_SCORE = 0;
Games.DEFAULT_WIN_POINTS = 10;
Games.MIN_DIFFICULTY = 1;
Games.MAX_DIFFICULTY = 3;