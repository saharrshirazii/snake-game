//Socket.IO is a JavaScript library that lets the server and browser talk to each other in real time.
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const { initGame, gameLoop, getUpdateVelocity } = require('./game');
const { frameRate } = require('./constants');
const { makeid } = require('./utils');

const state = {};
const clientRooms = {};

io.on('connection', client => {

    client.on('keydown', handleKeydown);
    client.on('newGame', handleNewGame);
    client.on('joinGame', handleJoinGame);
    client.on('rematch', handleRematch);


    function handleRematch() {
        const roomName = clientRooms[client.id];
        if (!roomName) return;
        // If state[roomName] already exists, it means the other player 
        // already clicked "Play Again", so we don't need to init again.
        if (state[roomName]) {
            return; 
        }
        // Reset game state
        state[roomName] = initGame();
        state[roomName].status = "Ongoing"; // Ensure status is set
        // Restart game loop
        startGameInterval(roomName);
        // Notify both players
        io.to(roomName).emit('rematchStarted');
    }

    function handleJoinGame(gameCode) {
        console.log("Join game attempt:", gameCode);

        // Check if game exists in your state
        // Note: state is created in handleNewGame
        const room = io.sockets.adapter.rooms.get(gameCode);
        
        // If room doesn't exist or no P1, return unknown
        if (!room || room.size === 0) {
            client.emit('unknownCode');
            return;
        }

        if (room.size > 1) {
            client.emit('tooManyPlayers');
            return;
        }

        // Join the room
        clientRooms[client.id] = gameCode;
        client.join(gameCode);
        client.number = 2;
        client.emit('init', 2);

        // Set Game Status
        // Safety check in case state was deleted
        if (state[gameCode]) {
            state[gameCode].status = "Ongoing";
        }
        
        startGameInterval(gameCode);
    }

    function handleNewGame(){
        let gameCode = makeid(5);
        clientRooms[client.id] = gameCode;
        client.emit('gameCode', gameCode);
        console.log('Created new game with code:', gameCode);
        state[gameCode] = initGame();
        client.join(gameCode);
        client.number = 1;
        client.emit('init', 1);
    }

    function handleKeydown(keyCode){
        const roomName = clientRooms[client.id];
        if (!roomName){
            return;
        }

        // FIX #2: Crash Prevention
        // If the game is over, state[roomName] might be deleted. 
        // Stop execution to prevent server crash.
        if (!state[roomName]) {
            return;
        }

        try{
            keyCode = parseInt(keyCode);
        }catch(e){
            console.error(e);
            return;
        }
        const vel = getUpdateVelocity(keyCode);
        if(vel){
            state[roomName].players[client.number -1].vel = vel;
        }
    }
});

function startGameInterval(roomName){
    const intervalId = setInterval(() => {
        // Safety check inside loop
        if (!state[roomName]) {
            clearInterval(intervalId);
            return;
        }

        const winner = gameLoop(state[roomName]);

        if (!winner){
            emitGameState(roomName, state[roomName]);
        } else {
            //Game status
            state[roomName].status = "Game Over";
            
            emitGameOver(roomName, winner);
            
            // Clean up state
            delete state[roomName];
            clearInterval(intervalId);
        }
    
    }, 1000 / frameRate);
}

function emitGameState(roomName, state){
    io.sockets.in(roomName)
    .emit('gameState', JSON.stringify(state));
}

function emitGameOver(roomName, winner){
    io.sockets.in(roomName)
    .emit('gameOver', JSON.stringify({winner}));
}

server.listen(3000, () => {
  console.log("✅ Server is running on http://localhost:3000");
});