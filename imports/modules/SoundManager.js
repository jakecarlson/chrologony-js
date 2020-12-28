import { Session } from "meteor/session";

// GAME SOUNDS
const AUDIO = {

    gameStart: '/game-start.mp4',
    gameWin: '/game-win.mp4',
    gameLose: '/game-lose.mp4',

    turnStart: '/turn-start.mp4',
    turnEnd: '/turn-end.mp4',

    cardDraw: '/card-draw.mp4',
    cardRight: '/card-right.mp4',
    cardWrong: '/card-wrong.mp4',

};

SoundManager = {

    initialized: false,

    init() {
        this.sounds = {};
        for (const sound in AUDIO) {
            this.sounds[sound] = new buzz.sound(AUDIO[sound]);
        }
        this.initialized = true;
    },

    play(sound) {
        if (this.initialized && !Helpers.isMuted()) {
            Logger.log('Play Sound: ' + sound);
            this.sounds[sound].play();
        }
    },

};