const bg_colour = "rgba(35, 31, 32, 1)";
const snake_colour = "#35d2e7ff";
const food_colour = "#e66916";
// Load food image
const foodImg = new Image();
foodImg.src = "food.png"; // local image named "food.png"




console.log("Client script loaded");
// const socket = io("http://localhost:3000");
const socket = io("https://mpapi.se");

socket.on("connect", () => {
  console.log("✅ Connected to server:", socket.id);
});

socket.on('rematchStarted', () => {
    gameActive = true;
});




socket.on('init', (number) => {
    playerNumber = number;
    init(); // Now the screen switches to the canvas
});
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownCode', handleUnknownCode);
socket.on('tooManyPlayers', handleTooManyPlayers);


let gameScreen, initialScreen, newGameBtn, joinGameBtn, gameCodeInput, gameCodeDisplay;
let statusText, scoreP1, scoreP2, playAgainBtn;

//for game status and scores
// Attach handlers after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    gameScreen = document.getElementById("gameScreen");
    initialScreen = document.getElementById("initialScreen");
    newGameBtn = document.getElementById("newGameButton");
    joinGameBtn = document.getElementById("joinGameButton");
    gameCodeInput = document.getElementById("GameCodeInput");
    gameCodeDisplay = document.getElementById("gameCodeDisplay");

    statusText = document.getElementById("gameStatus");
    scoreP1 = document.getElementById("scoreP1");
    scoreP2 = document.getElementById("scoreP2");

    playAgainBtn = document.getElementById("playAgainBtn");

    newGameBtn.addEventListener("click", newGame);
    joinGameBtn.addEventListener("click", joinGame);

    playAgainBtn.addEventListener("click", () => {
        playAgainBtn.style.display = "none";
        socket.emit("rematch");
        gameActive = true;
    });
});

function newGame(){
    console.log(" New Game button clicked");
    socket.emit("newGame");
    // init();
}

function joinGame(){
    const code = gameCodeInput.value;
    socket.emit("joinGame", code);
    // init();
}

// Consolidated single init handler: set playerNumber and start the client init
// socket.on('init', (number) => {
//     playerNumber = number;
//     init(); // switch to game canvas when server confirms
// });

let canvas , ctx;
let playerNumber;
let gameActive = false;


function init() {
    initialScreen.style.display = "none";
    gameScreen.style.display = "block";
    //canvas look like paper and ctx look like pencil to draw on that paper
     canvas = document.getElementById("canvas");
    //<canvas> by itself is an empty rectangle and i can not draw anything on it. 
    // getContext("2d") method returns a drawing context on the canvas. I want to draw 2D graphics on this canvas.
     ctx = canvas.getContext("2d");

    canvas.width = canvas.height = 600;

    ctx.fillStyle = bg_colour;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    document.addEventListener('keydown', keydown);
    gameActive = true;

}

// log key code of pressed key
function keydown(e) {
    // console.log(e.keyCode);
    socket.emit('keydown', e.keyCode);
}

//paint background
function paintGame(state){
        ctx.fillStyle = bg_colour;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const food = state.food;
        const gridsize = state.gridsize;
        const size = canvas.width / gridsize;

        // //draw food
        // ctx.fillStyle = food_colour;
        // ctx.fillRect(food.x * size, food.y * size, size, size);
        // Draw food as image
if (foodImg.complete) { // if the image has loaded
    ctx.drawImage(foodImg, food.x * size, food.y * size, size, size);
} else {
    // fallback rectangle if image not loaded yet
    ctx.fillStyle = food_colour;
    ctx.fillRect(food.x * size, food.y * size, size, size);
}


        paintPlayer(state.players[0], size, snake_colour);
           if (state.players[1]) {
               paintPlayer(state.players[1], size, '#ab4fbaff');
           }
}

function paintPlayer(playerState, size, colour){
    const snake = playerState.snake;
    ctx.fillStyle = colour;
    for (let cell of snake){
        ctx.fillRect(cell.x * size, cell.y * size, size, size);
    }
    }

    // function handleInit(number){
    //     playerNumber = number;
    //     }

   

    function handleGameState(gameState){
    if (!gameActive) return;

    gameState = JSON.parse(gameState);

    // Game Status
    statusText.innerText = "Status: " + gameState.status;

    // Scores
    const p1Score = gameState.players[0].snake.length - 3;
    scoreP1.innerText = Math.max(0, p1Score);

    if (gameState.players[1]) {
        const p2Score = gameState.players[1].snake.length - 3;
        scoreP2.innerText = Math.max(0, p2Score);
    }

    requestAnimationFrame(() => paintGame(gameState));
}



function handleGameOver(data) {
    if (!gameActive) return;
    data = JSON.parse(data);
    gameActive = false;
    alert(data.winner === playerNumber ? "You win!" : "You lose!");
    playAgainBtn.style.backgroundColor = "#28a745"; 
    playAgainBtn.style.color = "white";            
    playAgainBtn.style.padding = "10px 20px";      
    playAgainBtn.style.border = "none";
    playAgainBtn.style.borderRadius = "5px";
    playAgainBtn.style.cursor = "pointer";

    playAgainBtn.style.display = "block";
}

    function handleGameCode(gameCode){
        console.log("Game code received from server:", gameCode);
        gameCodeDisplay.innerText = gameCode;
    }

    function handleUnknownCode(){
        reset();
        alert("Unknown Game Code");
    }

    function handleTooManyPlayers(){
        reset();
        alert("This game is already in progress");
    }

    // function reset(){
    //     playerNumber = null;
    //     gameCodeInput.value = "";
    //     gameCodeDisplay.innerText = "";
    //     initialScreen.style.display = "block";
    //     gameScreen.style.display = "none";
    // }

    function reset(){
    playerNumber = null;
    gameCodeInput.value = "";
    gameCodeDisplay.innerText = "";

    scoreP1.innerText = "0";
    scoreP2.innerText = "0";
    statusText.innerText = "Status: Waiting";

    initialScreen.style.display = "block";
    gameScreen.style.display = "none";
}
