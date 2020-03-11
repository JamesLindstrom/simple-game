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
    speed: 8,

    init: function() {
        SimpleGame.space.innerHTML += '<div id="player"></div>';
        Player.elem = document.getElementById('player');
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
        // Left
        if ( keyPressed['37'] ) { Player.x -= Player.speed; }
        // Up
        if ( keyPressed['38'] ) { Player.y -= Player.speed; }
        // Right
        if ( keyPressed['39'] ) { Player.x += Player.speed; }
        // Down
        if ( keyPressed['40'] ) { Player.y += Player.speed; }
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
