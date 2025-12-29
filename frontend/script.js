const bg_colour = "#231f20";
const snake_colour = "#c2c2c2";
const food_colour = "#e66916";


// const socket = io("http://localhost:3000");

//من اضافه مردن
console.log("Client script loaded");
const socket = io("http://localhost:3000");
socket.on("connect", () => {
  console.log("✅ Connected to server:", socket.id);
});
//




socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownCode', handleUnknownCode);
socket.on('tooManyPlayers', handleTooManyPlayers);


const gameScreen = document.getElementById("gameScreen");
const initialScreen = document.getElementById("initialScreen");
const newGameBtn = document.getElementById("newGameButton");
const joinGameBtn = document.getElementById("joinGameButton");
const gameCodeInput = document.getElementById("GameCodeInput");
const gameCodeDisplay = document.getElementById("gameCodeDisplay");


newGameBtn.addEventListener("click", newGame);
joinGameBtn.addEventListener("click", joinGame);

function newGame(){
    //من اضافه کردم
    console.log("🟢 New Game button clicked");
    //
    socket.emit("newGame");
    init();
}

function joinGame(){
    const code = gameCodeInput.value;
    socket.emit("joinGame", code);
    init();
   
}


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

        //draw food
        ctx.fillStyle = food_colour;
        ctx.fillRect(food.x * size, food.y * size, size, size);

        paintPlayer(state.players[0], size, snake_colour);
        //من اضافه کردم
           if (state.players[1]) {
               paintPlayer(state.players[1], size, 'blue');
           }
}

function paintPlayer(playerState, size, colour){
    const snake = playerState.snake;
    ctx.fillStyle = colour;
    for (let cell of snake){
        ctx.fillRect(cell.x * size, cell.y * size, size, size);
    }
    }

    function handleInit(number){
        playerNumber = number;
        }

    function handleGameState(gameState){
        if (!gameActive){
            return;
        }
        gameState = JSON.parse(gameState);
        requestAnimationFrame(() => paintGame(gameState));
    }

    function handleGameOver(data){
        if (!gameActive){
            return;
        }
        data = JSON.parse(data);
        gameActive = false;

        if (data.winner === playerNumber){
            alert("You win!");
        }else{
            alert("You lose.");
        }
    }

    function handleGameCode(gameCode){
        //من اضافه کردم
        console.log("🎮 Game code received from server:", gameCode);
        //
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

    function reset(){
        playerNumber = null;
        gameCodeInput.value = "";
        gameCodeDisplay.innerText = "";
        initialScreen.style.display = "block";
        gameScreen.style.display = "none";
    }
