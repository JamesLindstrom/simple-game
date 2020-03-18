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
    initialized: false,

    init: function() {
        if ( SimpleGame.initialized ) { return false; } // Do not double initialize

        SimpleGame.enemyDiagonalSpeed = Math.round(Math.sqrt(Math.pow(SimpleGame.enemySpeed, 2) / 2));
        Score.init();
        Player.init();
        Treasure.init();
        SimpleGame.tick();
        SimpleGame.prepareSounds();

        // Pause if "P" is pressed.
        window.addEventListener('keydown', function(e){ if (e.keyCode == 80 && !SimpleGame.ended) { SimpleGame.pause(); } }, false );

        SimpleGame.initialized = true;
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
        }

        var enemy = new Hazard(enemyOptions);
    },

    gameOver: function() {
        SimpleGame.ended = true;
        SimpleGame.space.className = 'game-over';
        SimpleGame.backgroundMusic.stop();
        SimpleGame.gameOverMusic.play();
    },

    pause: function() {
        if ( SimpleGame.paused == false ) {
            SimpleGame.pauseSound.play();
            SimpleGame.paused = true;
            SimpleGame.space.className = 'paused';
            SimpleGame.backgroundMusic.stop();
        } else {
            SimpleGame.paused = false;
            SimpleGame.space.className = '';
            SimpleGame.backgroundMusic.play();
            SimpleGame.tick();
        }
    },

    prepareSounds: function() {
        SimpleGame.backgroundMusic = new Sound('background_music.mp3', { loop: true });
        SimpleGame.gameOverMusic = new Sound('loss.mp3');
        SimpleGame.pauseSound = new Sound('pause.mp3');
        SimpleGame.backgroundMusic.play();
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
        var elem = document.createElement('div');
        elem.setAttribute('class', 'hazard');
        elem.setAttribute('id', 'hazard-' + this.id);
        SimpleGame.space.appendChild(elem);
        this.elem = document.getElementById('hazard-' + this.id);
        this.xPlacementRangeMax = SimpleGame.spaceWidth - this.width;
        this.yPlacementRangeMax = SimpleGame.spaceHeight - this.height;
        this.alive = true;
        this.place();
        var myself = this;
        SimpleGame.space.addEventListener('gameTick', function(){ myself.tick(myself) }, false);
    }

    tick(object) {
        if ( object.destroyed ) { return false; } // Don't waste time on destroyed enemies
        if ( Player.bursting > 0 ) { object.burstResponse(object); }
        object.move(object);
        object.collide(object);
        object.draw(object);

        if ( object.destroyCountdown != undefined && object.destroyCountdown <= 0 ) {
            object.destroy(object);
        }
    }

    burstResponse(object) {
        if( SimpleGame.distanceBetween(Player, object) < Player.burstRadius + object.width / 2 ) {
            var theta = Math.atan((object.y + object.height / 2 - Player.y - Player.height / 2) / (object.x + object.width / 2 - Player.x - Player.width / 2));
            object.alive = false;
            var newYSpeed = Math.sin(theta) * Player.burstRadius / 2,
                newXSpeed = Math.cos(theta) * Player.burstRadius / 2;

            var reverser = 1;
            if ( object.x + object.width / 2 < Player.x + Player.width / 2 ) { reverser = -1; }
            object.xSpeed = newXSpeed * reverser;
            object.ySpeed = newYSpeed * reverser;
            object.destroyCountdown = 10;
        }
    }

    collide(object) {
        if ( object.alive && SimpleGame.checkCollision(object, Player) ) {
            SimpleGame.gameOver();
        }
    }

    destroy(object) {
        object.elem.parentNode.removeChild(object.elem);
        object.destroyed = true;
        object.x = -1000;
        object.y = -1000;
    }

    move(object) {
        if ( object.alive ) {
            if ( object.x >= object.xPlacementRangeMax || object.x < 0 ) { object.xSpeed *= -1; }
            if ( object.y >= object.yPlacementRangeMax || object.y < 0) { object.ySpeed *= -1; }
        }

        object.x += object.xSpeed;
        object.y += object.ySpeed;
    }

    draw(object) {
        object.elem.style = 'top: ' + object.y + 'px; left: ' + object.x + 'px; width: ' + object.width + 'px; height: '+ object.height + 'px;';
    }

    place() {
        this.x = Math.floor(Math.random() * this.xPlacementRangeMax);
        this.y = Math.floor(Math.random() * this.yPlacementRangeMax);

        // Don't allow the hazard to be placed too close to the player.
        if ( SimpleGame.distanceBetween(Player, this) < 180 ) {
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
    charged: false,
    superCharged: false,
    boostMultiplier: 2, // How much the boost affects speed
    boostDuration: 15, // How long the boost lasts (15 means 15 ticks or 0.5 seconds)
    boostCountdown: 0, // How many ticks of boost are left
    burstRadius: 120,
    burstDuration: 3,
    bursting: 0,

    init: function() {
        var elem = document.createElement('div');
        elem.setAttribute('id', 'player');
        SimpleGame.space.appendChild(elem);
        Player.elem = document.getElementById('player');
        Player.diagonalSpeed = Math.round(Math.sqrt(Math.pow(Player.speed, 2) / 2));
        Player.burstSound = new Sound('burst.mp3');
        SimpleGame.space.addEventListener('gameTick', Player.tick, false);
    },

    tick: function() {
        if ( Player.bursting > 0 ) { Player.bursting--; }
        if ( keyPressed[32] ) { Player.boost(); } // Boost if space is pressed
        Player.move();
        Player.draw();
    },

    boost: function() {
        if ( Player.charged && Player.boostCountdown == 0 ) { // Return false if the player is not charged or if boost has already begun
            Player.charged = false;
            Player.boostCountdown = Player.boostDuration;
            if ( Player.superCharged ) { Player.burst(); }
        }
    },

    burst: function() {
        Player.burstSound.play();
        Player.superCharged = false;
        Player.bursting = Player.burstDuration;
    },

    charge: function(superCharge) {
        Player.charged = true;
        if ( superCharge ) { Player.superCharged = true; }
    },

    draw: function() {
        Player.elem.style = 'top: ' + Player.y + 'px; left: ' + Player.x + 'px;';
        var classes = [];
        if ( Player.charged ) { classes.push('charged'); }
        if ( Player.superCharged ) { classes.push('super-charged'); }
        if ( Player.boostCountdown > 0 ) { classes.push('boosting'); }
        if ( Player.bursting > 0 ) { classes.push('bursting'); }
        Player.elem.className = classes.join(' ');
    },

    move: function() {
        var boostFactor = 1;
        if ( Player.boostCountdown > 0 ) {
            boostFactor = Player.boostMultiplier;
            Player.boostCountdown--;
        }

        if ( keyPressed['37'] && !keyPressed['38'] && !keyPressed['39'] && !keyPressed['40'] ) {
            // Left
            Player.x -= Player.speed * boostFactor;
        } else if ( keyPressed['37'] && keyPressed['38'] && !keyPressed['39'] && !keyPressed['40'] ) {
            // Left-Up
            Player.y -= Player.diagonalSpeed * boostFactor;
            Player.x -= Player.diagonalSpeed * boostFactor;
        } else if ( !keyPressed['37'] && keyPressed['38'] && !keyPressed['39'] && !keyPressed['40'] ) {
            // Up
            Player.y -= Player.speed * boostFactor;
        } else if ( !keyPressed['37'] && keyPressed['38'] && keyPressed['39'] && !keyPressed['40'] ) {
            // Right-Up
            Player.y -= Player.diagonalSpeed * boostFactor;
            Player.x += Player.diagonalSpeed * boostFactor;
        } else if ( !keyPressed['37'] && !keyPressed['38'] && keyPressed['39'] && !keyPressed['40'] ) {
            // Right
            Player.x += Player.speed * boostFactor;
        } else if ( !keyPressed['37'] && !keyPressed['38'] && keyPressed['39'] && keyPressed['40'] ) {
            // Right-Down
            Player.y += Player.diagonalSpeed * boostFactor;
            Player.x += Player.diagonalSpeed * boostFactor;
        } else if ( !keyPressed['37'] && !keyPressed['38'] && !keyPressed['39'] && keyPressed['40'] ) {
            // Down
            Player.y += Player.speed * boostFactor;
        } else if ( keyPressed['37'] && !keyPressed['38'] && !keyPressed['39'] && keyPressed['40'] ) {
            // Left-Down
            Player.y += Player.diagonalSpeed * boostFactor;
            Player.x -= Player.diagonalSpeed * boostFactor;
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
    superCount: 1, // Steps counting to supercharge
    superInterval: 15, // Total steps between each supercharge

    init: function() {
        var elem = document.createElement('div');
        elem.setAttribute('id', 'treasure');
        SimpleGame.space.appendChild(elem);
        Treasure.elem = document.getElementById('treasure');
        Treasure.xPlacementRangeMax = SimpleGame.spaceWidth - Treasure.width;
        Treasure.yPlacementRangeMax = SimpleGame.spaceHeight - Treasure.height;
        Treasure.place();
        Treasure.collectSound = new Sound('treasure_collect.mp3');
        SimpleGame.space.addEventListener('gameTick', Treasure.tick, false);
    },

    tick: function() {
        if( SimpleGame.checkCollision(Treasure, Player) ) { Treasure.collect(); }
    },

    collect: function() {
        Treasure.collectSound.play();
        Score.increase(10);

        if ( Treasure.superCount >= Treasure.superInterval ) {
            Player.charge(true);
            Treasure.superCount = 0;
        } else {
            Player.charge(false);
        }

        Treasure.superCount++;
        Treasure.place();
    },

    draw: function() {
        Treasure.elem.style = 'top: ' + Treasure.y + 'px; left: ' + Treasure.x + 'px;';
    },

    place: function() {
        Treasure.x = Math.floor(Math.random() * Treasure.xPlacementRangeMax);
        Treasure.y = Math.floor(Math.random() * Treasure.yPlacementRangeMax);

        if ( Treasure.superCount >= Treasure.superInterval ) {
            Treasure.elem.className = 'super-charged';
        } else {
            Treasure.elem.className = '';
        }

        // Don't allow the treasure to be placed too close to the player.
        if ( SimpleGame.distanceBetween(Player, Treasure) < 150 ) {
            Treasure.place();
        }
        Treasure.draw();
    }
}

var Score = {
    value: 0,
    hi: localStorage.getItem('simple_game_hi_score') || 0,

    init: function() {
        SimpleGame.space.innerHTML += '<p id="score-text">Score: <span id="score"></span></p>';
        SimpleGame.space.innerHTML += '<p id="hi-score-text">Hi Score: <span id="hi-score"></span></p>';
        Score.elem = document.getElementById('score');
        Score.hiElem = document.getElementById('hi-score');
        Score.draw();
    },

    draw: function() {
        Score.elem.innerHTML = Score.value;
        Score.hiElem.innerHTML = Score.hi;
    },

    increase(scoreIncrease) {
        Score.value += scoreIncrease;
        Score.setHi();
        Score.draw();
    },

    setHi: function() {
        if ( Score.value > Score.hi ) {
            Score.hi = Score.value;
            localStorage.setItem('simple_game_hi_score', Score.value);
            Score.draw();
        }
    }
}

class Sound {
    constructor(src, options) {
        if ( options == undefined ) { options = {}; }
        this.sound = document.createElement("audio");
        this.sound.src = 'sounds/' + src;
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        if ( options["loop"] ) { this.sound.setAttribute("loop", true); }
        SimpleGame.space.appendChild(this.sound);
    }

    play() {
        if ( this.sound.paused ) {
            this.sound.play();
        } else {
            this.sound.currentTime = 0;
        }
    }

    stop() {
        this.sound.pause();
    }
}
