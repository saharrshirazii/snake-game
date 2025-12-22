const bg_colour = "#231f20";
const snake_colour = "#c2c2c2";
const food_colour = "#e66916";

const gameScreen = document.getElementById("gameScreen");

let canvas , ctx;

const gameState = {
    player: {
        //position of player 1
        pos:{
            x:3,
            y:10,
        },
    
        //velocity of snake
        vel: {
           x:1,
           y:0,
       },
        snake: [
           {x:1, y:10},
           {x:2, y:10},
           {x:3, y:10},
        ],  
    },
    food: {
        x:7,
        y:7,
    },
    // snake body parts  
    gridsize: 20,
}

function init() {
    //canvas look like paper and ctx look like pencil to draw on that paper
     canvas = document.getElementById("canvas");
    //<canvas> by itself is an empty rectangle and i can not draw anything on it. 
    // getContext("2d") method returns a drawing context on the canvas. I want to draw 2D graphics on this canvas.
     ctx = canvas.getContext("2d");

    canvas.width = canvas.height = 600;

    ctx.fillStyle = bg_colour;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    document.addEventListener("keydown", keydown);

}

// log key code of pressed key
function keydown(event) {
    console.log(event.keyCode);
}

init();

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

        painPlayer(state.player, size, snake_colour);
}

function painPlayer(playerState, size, colour){
    const snake = playerState.snake;
    ctx.fillStyle = colour;
    for (let cell of snake){
        ctx.fillRect(cell.x * size, cell.y * size, size, size);
    }
    }

    paintGame(gameState);