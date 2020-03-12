var gameTick = new CustomEvent('gameTick');

var keyPressed = {};
window.onkeyup = function(e) { keyPressed[e.keyCode] = false; }
window.onkeydown = function(e) { keyPressed[e.keyCode] = true; }

var SimpleGame = {
    space: document.getElementById('game-space'),
    tickSpacing: 33, // 30 TPS
    spaceWidth: 640,
    spaceHeight: 480,
    currentTick: 0,
    enemyCount: 0,
    enemySpacing: 150, // Spawn an enemy every 300 ticks or every 10 seconds
    enemySpeed: 5,
    paused: false,
    ended: false,

    init: function() {
        SimpleGame.enemyDiagonalSpeed = Math.round(Math.sqrt(Math.pow(SimpleGame.enemySpeed, 2) / 2));
        Player.init();
        Treasure.init();
        Score.init();
        SimpleGame.tick();

        // Pause if "P" is pressed.
        window.addEventListener('keydown', function(e){ if (e.keyCode == 80 && !SimpleGame.ended) { SimpleGame.pause(); } }, false );
    },

    tick: function() {
        if ( SimpleGame.paused || SimpleGame.ended ) {
            return false;
        }

        SimpleGame.currentTick++;

        SimpleGame.space.dispatchEvent(gameTick);

        if ( SimpleGame.enemyCount < Math.floor(SimpleGame.currentTick / SimpleGame.enemySpacing) ) {
            SimpleGame.createEnemy();
        }

        setTimeout(SimpleGame.tick, SimpleGame.tickSpacing);
    },

    checkCollision: function(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x && obj1.y < obj2.y + obj2.height && obj1.y + obj1.height > obj2.y;
    },

    distanceBetween: function(obj1, obj2) {
        var obj1CenterX = obj1.x + obj1.width / 2,
            obj1CenterY = obj1.y + obj1.height / 2,
            obj2CenterX = obj2.x + obj2.width / 2,
            obj2CenterY = obj2.y + obj2.height / 2;
        return Math.sqrt(Math.pow(obj2CenterX - obj1CenterX, 2) + Math.pow(obj2CenterY - obj1CenterY, 2));
    },

    createEnemy: function() {
        SimpleGame.enemyCount++;
        var enemyOptions = {};

        if ( SimpleGame.enemyCount % 3 === 0 ) {
            enemyOptions.xSpeed = SimpleGame.enemyDiagonalSpeed;
            enemyOptions.ySpeed = SimpleGame.enemyDiagonalSpeed;
        } else if ( SimpleGame.enemyCount % 2 ) {
            enemyOptions.xSpeed = SimpleGame.enemySpeed;
            enemyOptions.ySpeed = 0;
        } else {
            enemyOptions.xSpeed = 0;
            enemyOptions.ySpeed = SimpleGame.enemySpeed;
        }

        if ( SimpleGame.enemyCount > 10 ) {
            enemyOptions.xSpeed = Math.floor(enemyOptions.xSpeed * 1.3);
            enemyOptions.ySpeed = Math.floor(enemyOptions.ySpeed * 1.3);
            enemyOptions.width = 30;
            enemyOptions.height = 30;
        }

        var enemy = new Hazard(enemyOptions);
    },

    gameOver: function() {
        SimpleGame.ended = true;
        SimpleGame.space.className = 'game-over'
    },

    pause: function() {
        if ( SimpleGame.paused == false ) {
            SimpleGame.paused = true;
            SimpleGame.space.className = 'paused';
        } else {
            SimpleGame.paused = false;
            SimpleGame.space.className = '';
            SimpleGame.tick();
        }
    }
}

class Hazard {
    constructor(options) {
        this.id = SimpleGame.enemyCount;
        this.width = options['width'] || 60;
        this.height = options['height'] || 60;
        this.ySpeed = options['ySpeed'] || 0;
        this.xSpeed = options['xSpeed'] || 0;
        this.moveDirection = options['moveDirection'] || 'right';
        SimpleGame.space.innerHTML += '<div class="hazard" id="hazard-' + this.id + '"></div>';
        this.elem = document.getElementById('hazard-' + this.id);
        this.xPlacementRangeMax = SimpleGame.spaceWidth - this.width;
        this.yPlacementRangeMax = SimpleGame.spaceHeight - this.height;
        this.place();
        var myself = this;
        SimpleGame.space.addEventListener('gameTick', function(){ myself.tick(myself) }, false);
    }

    tick(object) {
        object.move(object);
        object.collide(object);
        object.draw(object);
    }

    collide(object) {
        if ( SimpleGame.checkCollision(object, Player) ) {
            SimpleGame.gameOver();
        }
    }

    move(object) {
        if ( object.x >= object.xPlacementRangeMax || object.x < 0 ) { object.xSpeed *= -1; }
        if ( object.y >= object.yPlacementRangeMax || object.y < 0) { object.ySpeed *= -1; }

        object.x += object.xSpeed;
        object.y += object.ySpeed;
    }

    draw(object) {
        object.elem = document.getElementById('hazard-' + object.id);
        object.elem.style = 'top: ' + object.y + 'px; left: ' + object.x + 'px; width: ' + object.width + 'px; height: '+ object.height + 'px;';
    }

    place() {
        this.x = Math.floor(Math.random() * this.xPlacementRangeMax);
        this.y = Math.floor(Math.random() * this.yPlacementRangeMax);

        // Don't allow the hazard to be placed too close to the player.
        if ( SimpleGame.distanceBetween(Player, this) < 150 ) {
            this.place();
        }
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
        Player.elem.style = 'top: ' + Player.y + 'px; left: ' + Player.x + 'px;';
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

        Player.warp();
    },

    warp: function() {
        if ( Player.x > SimpleGame.spaceWidth ) { Player.x = -1 * Player.width }
        if ( Player.x < -1 * Player.width ) { Player.x = SimpleGame.spaceWidth }
        if ( Player.y > SimpleGame.spaceHeight ) { Player.y = -1 * Player.height }
        if ( Player.y < -1 * Player.height ) { Player.y = SimpleGame.spaceHeight }
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
