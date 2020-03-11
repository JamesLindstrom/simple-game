var gameTick = new CustomEvent('gameTick');

var keyPressed = {};
window.onkeyup = function(e) { keyPressed[e.keyCode] = false; }
window.onkeydown = function(e) { keyPressed[e.keyCode] = true; }

var SimpleGame = {
    space: document.getElementById('game-space'),
    tickSpacing: 33, // 30 TPS
    spaceWidth: 640,
    spaceHeight: 480,

    init: function() {
        Player.init();
        Box.init();
        Treasure.init();
        Score.init();
        SimpleGame.tick();
    },

    tick: function() {
        SimpleGame.space.dispatchEvent(gameTick);

        setTimeout(SimpleGame.tick, SimpleGame.tickSpacing);
    },

    checkCollision: function(obj1, obj2) {
        if ( obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x && obj1.y < obj2.y + obj2.height && obj1.y + obj1.height > obj2.y) {
            return true;
        } else {
            return false;
        }
    },

    distanceBetween: function(obj1, obj2) {
        return Math.sqrt(Math.pow(obj2.x - obj1.x, 2) + Math.pow(obj2.y - obj1.y, 2));
    }
}

var Box = {
    x: 60,
    y: 60,
    width: 90,
    height: 60,

    init: function() {
        SimpleGame.space.innerHTML += '<div id="box"></div>';
        Box.elem = document.getElementById('box');
        Box.draw();
    },

    draw: function() {
        Box.elem.style = 'top: ' + Box.y + 'px; left: ' + Box.x + 'px; width: ' + Box.width + 'px; height: '+ Box.height + 'px;';
    }
}

var Player = {
    x: 305,
    y: 225,
    width: 30,
    height: 30,
    speed: 10,

    init: function() {
        SimpleGame.space.innerHTML += '<div id="player"></div>';
        Player.elem = document.getElementById('player');
        Player.diagonalSpeed = Math.round(Math.sqrt(Math.pow(Player.speed, 2) / 2));
        SimpleGame.space.addEventListener('gameTick', Player.tick, false);
    },

    tick: function() {
        // console.log('Player.tick');
        Player.elem = document.getElementById('player');
        Player.move();
        Player.draw();
    },

    draw: function() {
        Player.elem.style = 'top: ' + Player.y + 'px; left: ' + Player.x + 'px; background-color: ' + Player.currentColor() + ';';
    },

    move: function() {
        if ( keyPressed['37'] && !keyPressed['38'] && !keyPressed['39'] && !keyPressed['40'] ) {
            // Left
            Player.x -= Player.speed;
        } else if ( keyPressed['37'] && keyPressed['38'] && !keyPressed['39'] && !keyPressed['40'] ) {
            // Left-Up
            Player.y -= Player.diagonalSpeed;
            Player.x -= Player.diagonalSpeed;
        } else if ( !keyPressed['37'] && keyPressed['38'] && !keyPressed['39'] && !keyPressed['40'] ) {
            // Up
            Player.y -= Player.speed;
        } else if ( !keyPressed['37'] && keyPressed['38'] && keyPressed['39'] && !keyPressed['40'] ) {
            // Right-Up
            Player.y -= Player.diagonalSpeed;
            Player.x += Player.diagonalSpeed;
        } else if ( !keyPressed['37'] && !keyPressed['38'] && keyPressed['39'] && !keyPressed['40'] ) {
            // Right
            Player.x += Player.speed;
        } else if ( !keyPressed['37'] && !keyPressed['38'] && keyPressed['39'] && keyPressed['40'] ) {
            // Right-Down
            Player.y += Player.diagonalSpeed;
            Player.x += Player.diagonalSpeed;
        } else if ( !keyPressed['37'] && !keyPressed['38'] && !keyPressed['39'] && keyPressed['40'] ) {
            // Down
            Player.y += Player.speed;
        } else if ( keyPressed['37'] && !keyPressed['38'] && !keyPressed['39'] && keyPressed['40'] ) {
            // Left-Down
            Player.y += Player.diagonalSpeed;
            Player.x -= Player.diagonalSpeed;
        }
    },

    currentColor: function() {
        if ( SimpleGame.checkCollision(Player, Box) ) {
            return '#f00';
        } else {
            return '#00f'
        }
    }
}

var Treasure = {
    height: 30,
    width: 30,

    init: function() {
        SimpleGame.space.innerHTML += '<div id="treasure"></div>';
        Treasure.elem = document.getElementById('treasure');
        Treasure.xPlacementRangeMax = SimpleGame.spaceWidth - Treasure.width;
        Treasure.yPlacementRangeMax = SimpleGame.spaceHeight - Treasure.height;
        Treasure.place();
        SimpleGame.space.addEventListener('gameTick', Treasure.tick, false);
    },

    tick: function() {
        Treasure.elem = document.getElementById('treasure');
        Treasure.draw();

        if( SimpleGame.checkCollision(Treasure, Player) ) {
            Score.value += 10;
            Treasure.place();
        }
    },

    draw: function() {
        Treasure.elem.style = 'top: ' + Treasure.y + 'px; left: ' + Treasure.x + 'px;';
    },

    place: function() {
        Treasure.x = Math.floor(Math.random() * Treasure.xPlacementRangeMax);
        Treasure.y = Math.floor(Math.random() * Treasure.yPlacementRangeMax);

        // Don't allow the treasure to be placed too close to the player.
        if ( SimpleGame.distanceBetween(Player, Treasure) < 150 ) {
            Treasure.place();
        }
    }
}

var Score = {
    value: 0,

    init: function() {
        SimpleGame.space.innerHTML += '<p id="score-text">Score: <span id="score"></span></p>';
        Score.draw();
        SimpleGame.space.addEventListener('gameTick', Score.tick, false);
    },

    tick: function() {
        Score.draw();
    },

    draw: function() {
        Score.elem = document.getElementById('score');
        Score.elem.innerHTML = Score.value;
    }
}

SimpleGame.init();
