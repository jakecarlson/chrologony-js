import '/node_modules/bootstrap-tourist/bootstrap-tourist.css';
const Tour = require('bootstrap-tourist');

TourGuide = {

    tour: false,
    paused: false,
    categoriesStep: 11,
    cluesStep: 13,

    isActive() {
        return (this.tour != false);
    },

    isPaused() {
        return (this.isActive() && this.paused);
    },

    canEndTurn() {
        if (!this.isActive()) {
            return true;
        }
        return this.allowEndTurnSteps.includes(this.tour.getCurrentStepIndex());
    },

    isCategoriesStep() {
        return (this.tour.getCurrentStepIndex() == this.categoriesStep);
    },

    isCluesStep() {
        return (this.tour.getCurrentStepIndex() == this.cluesStep);
    },

    start() {

        // Instantiate the tour
        this.tour = new Tour({
            name: 'intro',
            framework: 'bootstrap4',
            showProgressBar: true,
            showProgressText: true,
            backdrop: true,
            onEnd: function(tour) {
                TourGuide.tour = false;
                TourGuide.paused = false;
            },
            // debug: true,
            localization: {
                buttonTexts: {
                    prevButton: 'Back',
                    nextButton: 'Continue',
                    endTourButton: 'End Tour',
                }
            },
            steps: [
                {
                    element: "#layout",
                    preventInteraction: true,
                    placement: "right",
                    title: "The Lobby",
                    content: "Welcome to Chrologony, the game where players sequence events into a timeline. This is the Lobby, the first screen you will see after logging in. From here you can create a new room or join an existing room.",
                },
                {
                    element: "#join",
                    onShown: this.wait,
                    placement: "top",
                    title: "Create or Join a Room",
                    content: "Let's jump right in and create a room! Enter a room name and password, then click 'Go'.",
                },
                {
                    element: "#layout",
                    preventInteraction: true,
                    placement: "bottom",
                    title: "The Room",
                    content: "This is a room, where the game actually happens. The room name is on the upper left; the room menu is on the upper right. The large box on the left is the Turn Board, and there are one or more side panels that provide more information about what's happening in the room.",
                },
                {
                    element: "#players",
                    placement: "right",
                    title: "Players in this Room",
                    content: "This is the list of players currently in this room. Each player's current score is shown to the right of their name. If you are the room owner, you will also see an 'x' next to all players (besides yourself), which will allow you to eject that player from the room.",
                },
                {
                    element: "#game",
                    onShown: this.wait,
                    placement: "top",
                    title: "Start a New Game",
                    content: "Only the owner of a room can start a new game. You can start a new game whenever you wish, but note that the current game will be discarded when you do so. Select a category to use, then click on the 'Start' button.",
                },
                {
                    element: "#board",
                    preventInteraction: true,
                    placement: "left",
                    title: "The Turn Board",
                    content: "The Turn Board shows what's going on for the current player's turn. Everyone can see it, but only the player whose turn it is can take any actions. The only exception is that the room owner can end another player's turn on his/her behalf to keep the game moving. The title bar and border of the Turn Board will become blue when it's your turn.",
                },
                {
                    element: "#board",
                    onShown: this.wait,
                    placement: "left",
                    title: "Submit a Guess",
                    content: "The currently active card is blue. Move it by clicking on the arrows, or by dragging it to where you think it belongs in the timeline. Note that you can view any non-active card by moving your mouse over it. When the active card is in the right place, click on the 'Submit Guess' button.",
                },
                {
                    element: "#board",
                    preventInteraction: true,
                    placement: "left",
                    title: "Were You Right?",
                    content: "If you guessed wrong, the active card and the Turn Board title bar will become red. All you can do now is end your turn. If you guessed right, the card will turn yellow, and the Turn Board title bar will turn green. You will then have the option of drawing a new card or locking your points in by ending your turn. Just remember that you will lose all the cards guessed correctly on your turn once you get one wrong.",
                },
                {
                    element: "#board .end-turn",
                    onShown: this.wait,
                    placement: "right",
                    title: "End Your Turn",
                    content: "Now let's end your turn by clicking on the 'End Turn' button. If you are the only player in the room, it will be your turn again; otherwise it will be the next player's turn. Any cards you guessed right will turn green to indicate that they are locked in. Note that if a new player enters the room when a game is in progress, that player will get as many turns as it takes for him/her to catch up to the rest of the players in total turns.",
                },
                {
                    element: "#roomMenu",
                    preventInteraction: true,
                    placement: "right",
                    title: "Room Menu",
                    content: "Feeling lonely in here all by yourself? To invite others to play with you, click on the 'Room Link' button and send others the copied URL. They can also join the room by entering the room name and password from the Lobby. You can leave the room and go back to the Lobby by clicking on the 'Leave Room' button.",
                },
                {
                    element: "#menu",
                    onShown: this.wait,
                    placement: "right",
                    title: "Navigation",
                    content: "You can navigate around using the menu at the top right of the screen. Next, let's try contributing some of your own categories and clues. Click on the your username to show the menu dropdown, then click on 'Categories'.",
                },
                {
                    element: "#managers",
                    delayOnElement: {
                        delayElement: "#managers",
                        maxDelay: 2000,
                    },
                    onShown: this.wait,
                    placement: "left",
                    title: "Managing Categories and Clues",
                    content: "You're not restricted to the categories and clues that come with the game. You can create your own categories and contribute clues to categories others have created. Click on the 'Categories' tab to see how.",
                },
                {
                    element: "#categories",
                    onShown: this.wait,
                    placement: "top",
                    title: "Add a Category",
                    content: "The 'Categories' tab lets you manage any categories you own or to which you have been added as a collaborator. Try adding a test category right now by filling out and submitting the green form at the top of the list. You can add a public or private category. Let's make this one private, and don't forget to toggle it 'Active' so we can add clues to it.",
                },
                {
                    element: "#managers",
                    onShown: this.wait,
                    placement: "left",
                    title: "Adding Clues to Categories",
                    content: "Good job! You can edit and remove categories that you own as well. Now that you've created a category, let's add some clues to it. Click on the 'Clues' tab to contribute and manage clues in the categories you own or for which you are a collaborator.",
                },
                {
                    element: "#clues",
                    onShown: this.wait,
                    placement: "top",
                    title: "Select a Category",
                    content: "In order to manage the clues in a category, first you must select a category. You will only be able to select categories that you own, categories for which you have been added as a collaborator, or public categories. Select the category you just created to continue.",
                },
                {
                    element: "#clues",
                    onShown: this.wait,
                    placement: "top",
                    title: "Add a Clue",
                    content: "Now that you've selected a category, you'll see a list of all the clues in that category. Fill out and submit the green form at the top of the list to add a new clue. You can filter and edit any clues you have previously created on this screen as well.",
                },
                {
                    element: "#layout",
                    preventInteraction: true,
                    placement: "top",
                    title: "The End",
                    content: "That's it! You now know how to create a room and play the game. You also learned how to create your own categories and clues. There's plenty more to explore, but you now know the basics. Go have fun! Click on the 'End Tour' button.",
                }
            ],
        });

        // Start the tour
        this.tour.restart();

    },

    wait(tour) {
        this.paused = true;
        $('.tour-intro .popover-navigation [data-role="next"]').prop('disabled', true);
    },

    resume() {
        if (this.isActive()) {
            this.paused = false;
            this.tour.next();
        }
    },



};