//Socket.IO is a JavaScript library that lets the server and browser talk to each other in real time.

// Import Socket.IO 
// const io = require('socket.io')();
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


// Listen for a new client connections
//This runs every time a browser connects
//client represents one connected user
io.on('connection', client => {
    //Sends an event named "init" to that specific client
    //Along with some data
    // On the client side, you’d listen like this:
    // socket.on('init', data => {
    //console.log(data);
    //});
    // client.emit ('init', {data: 'Welcome to the server!'});
    // const state = createGameState();

    client.on('keydown', handleKeydown);
    client.on('newGame', handleNewGame);
    client.on('joinGame', handleJoinGame);

    // function handleJoinGame(roomName){
    //     // const room = io.sockets.adapter.rooms.get[gameCode];
    //     const room = io.sockets.adapter.rooms.get(roomName);


    //     let allUsers;
    //     if (room){
    //         allUsers = room.sockets;  
    //     }

    //     let numClients = 0;
    //     if (allUsers){
    //         numClients = Object.keys(allUsers).length;
    //     }

    //     if (numClients === 0){
    //         client.emit('unknownCode');

    //         return;
    //     }else if (numClients > 1){
    //         client.emit('tooManyPlayers');
    //         return;
    //     } 

    //     clientRooms[client.id] = roomName;

    //     client.join(roomName);
    //     client.number = 2;
    //     client.emit('init', 2);     

    //     startGameInterval(roomName);
    // }



    function handleJoinGame(gameCode) {
    console.log("Join game attempt:", gameCode);

    // Check if game exists in your state
    if (!state[gameCode]) {
        client.emit('unknownCode');
        return;
    }

    // Count how many clients are in this room
    const room = io.sockets.adapter.rooms.get(gameCode);
    const numClients = room ? room.size : 0;

    if (numClients > 1) {
        client.emit('tooManyPlayers');
        return;
    }

    // Join the room
    clientRooms[client.id] = gameCode;
    client.join(gameCode);
    client.number = 2;
    client.emit('init', 2);

    startGameInterval(gameCode);
}











    function handleNewGame(){
        //من اضافه کردم
            console.log("🔥 newGame event received from client");
        //
        let gameCode = makeid(5);
        clientRooms[client.id] = gameCode;
        client.emit('gameCode', gameCode);
        //من اضافه کردم
            console.log('Created new game with code:', gameCode);
            //
        
        // state[gameCode] = createGameState();
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
    // startGameInterval(client, state);
});

    function startGameInterval(roomName){
        const intervalId = setInterval(() => {
            const winner = gameLoop(state[roomName]);

            if (!winner){
                emitGameState(roomName, state[roomName]);
            } else {
                emitGameOver(roomName, winner);
                state[roomName] = null;
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
// Starts the Socket.IOserver 
// io.listen(3000);

server.listen(3000, () => {
  console.log("✅ Server is running on http://localhost:3000");
});