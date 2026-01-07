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
// Track intervals so we don't start duplicates and can clear them
const intervals = {};

io.on('connection', client => {

    client.on('keydown', handleKeydown);
    client.on('newGame', handleNewGame);
    client.on('joinGame', handleJoinGame);
    client.on('rematch', handleRematch);


    function handleRematch() {
        const roomName = clientRooms[client.id];
        if (!roomName) return;

        // If a game state already exists, do not re-init (other player may have already rematched)
        if (state[roomName]) {
            return;
        }

        // Create/reset game state and start loop
        state[roomName] = initGame();
        state[roomName].status = "Ongoing";

        // Clear any stray interval and start a fresh one
        if (intervals[roomName]) {
            clearInterval(intervals[roomName]);
            delete intervals[roomName];
        }
        startGameInterval(roomName);
        io.to(roomName).emit('rematchStarted');
    }

    function handleJoinGame(gameCode) {
        console.log("Join game attempt:", gameCode);

        const room = io.sockets.adapter.rooms.get(gameCode);
        
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

        // Ensure a game state exists (if previous game ended and state was deleted)
        if (!state[gameCode]) {
            state[gameCode] = initGame();
        }
        state[gameCode].status = "Ongoing";
        
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

        // Crash prevention if state missing
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

    // Clean up on disconnect
    client.on('disconnect', () => {
        const roomName = clientRooms[client.id];
        if (!roomName) return;
        delete clientRooms[client.id];
        client.leave(roomName);

        const room = io.sockets.adapter.rooms.get(roomName);
        if (!room || room.size === 0) {
            // No players left — clear state and interval
            if (state[roomName]) delete state[roomName];
            if (intervals[roomName]) {
                clearInterval(intervals[roomName]);
                delete intervals[roomName];
            }
        } else {
            // Notify remaining player
            io.to(roomName).emit('playerDisconnected');
        }
    });
});

function startGameInterval(roomName){
    // Do not start multiple intervals for the same room
    if (intervals[roomName]) return;

    const intervalId = setInterval(() => {
        if (!state[roomName]) {
            clearInterval(intervalId);
            if (intervals[roomName]) delete intervals[roomName];
            return;
        }

        const winner = gameLoop(state[roomName]);

        if (!winner){
            emitGameState(roomName, state[roomName]);
        } else {
            state[roomName].status = "Game Over";
            emitGameOver(roomName, winner);

            // Clean up
            delete state[roomName];
            clearInterval(intervalId);
            if (intervals[roomName]) delete intervals[roomName];
        }
    
    }, 1000 / frameRate);

    intervals[roomName] = intervalId;
}

function emitGameState(roomName, state){
    io.sockets.in(roomName)
    .emit('gameState', JSON.stringify(state));
}

function emitGameOver(roomName, winner){
    io.sockets.in(roomName)
    .emit('gameOver', JSON.stringify({winner}));
}

// server.listen(3000, () => {
//     console.log("✅ Server is running on https://mpapi.se");

// });

const PORT = process.env.PORT || 3000; 
server.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});