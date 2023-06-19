var express = require('express');
var router = express.Router();
let Error = require("../models/error.js");
let Game = require("../models/game.js");
let Metadata = require("../models/metadata.js");
let Theme = require("../models/theme.js");
let Token = require("../models/token.js");
const { v4: uuidv4 } = require('uuid');



/* ##################### DATABASE STUFF ###################### */

// Some awesome icons, credit to Filipe de Carvalho
var Luke = new Token('Luke', "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/8dd7e817998561.5635a605b5684.png");
var Vader = new Token('Vader', "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/29bd6417998561.5635a605ad357.png");
const tokArr = [Luke, Vader,
            new Token('Yoda', "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/d937cb17998561.5635a605a208c.png"),
            new Token('Chewbaca', "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/29dd2a17998561.5635a605bf76c.png"),
            new Token('Stormtrooper', "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/4134a417998561.5635a605c6ed2.png"),
            new Token('Leia', "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/8f834817998561.5635a605c8d17.png"),
            new Token('C3P0', "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/5508a017998561.5635a605cd904.png"),
            new Token('Emperor', "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/57f58517998561.5635a605d2424.png"),
            new Token('Han', "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/4af31517998561.5635a605daa24.png"),
            new Token('R2D2', "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/7d244617998561.5635a605e3323.png"),
            new Token('Boba', "https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/e738ae17998561.5635a605e81c7.png"),
];


var defaultTheme = new Theme('#ff0000', Luke, Vader);
var metadata = new Metadata(tokArr, defaultTheme);

/* Keyed by {sid: {gid:game, ...}, 
            sid: {gid:game, ...}
            ....} */
var db = {}

/* Create a new session id and create a session entry in the db */
function createSid() {
    var sid = uuidv4();
    db[sid] = {};
    return sid;
}

/* Get all the games for this session */
function getGamesBySid(sid) {
    if(sid in db) {
      return db[sid];
    }
    else {
      return new Error("Invalid Session Id.")
    }
    
}

/* Get the game with this session id and game id */
function getGame(sid, gid) {
    if(sid in db && gid in db[sid]) {
      return db[sid][gid];
    }
    else {
      return new Error("Invalid Session or Game Id.")
    }
}

/* Create a new game with these parameters and put it into the db */
function createGame(sid, color, playerToken, cpuToken) {
  if(sid in db) {
    var game = new Game(new Theme(color, playerToken, cpuToken), 'UNFINISHED', new Date().toLocaleString(), null, newGrid());
    db[sid][game.id] = game;
    return game;
  }
  else {
    return new Error("Invalid Session Id.");
  }
}

function newGrid() {
  return [ [' ', ' ', ' ', ' ', ' ', ' ', ' '],
           [' ', ' ', ' ', ' ', ' ', ' ', ' '],
           [' ', ' ', ' ', ' ', ' ', ' ', ' '],
           [' ', ' ', ' ', ' ', ' ', ' ', ' '],
           [' ', ' ', ' ', ' ', ' ', ' ', ' '] ];
}

/* Make player move and respond with a cpu move*/
function makeMoveSequence(sid, gid, move) {
  if(sid in db && gid in db[sid]) {
    var game = db[sid][gid];
    if(move <= 6 && move >= 0) {
        // Try to make player move, make no change if not possible
        if(makeMove(game, move, 'Player') == false) {
          return game;
        }

        // Check if game is over
        var newStatus = gameOver(game);
        if(newStatus == "VICTORY") {
          game.status = "VICTORY";
          game.finish = new Date().toLocaleString();
          return game;
        }
        else if(newStatus == "TIE") {
          game.status = "TIE";
          game.finish = new Date().toLocaleString();
          return game;
        }

        // Computer makes move (Keep trying until valid move is made)
        var success;
        do {
          success = makeMove(game, Math.floor(Math.random() * 7), 'Computer');
        } while( !success );

        // Check if game is over
        newStatus = gameOver(game);
        if(newStatus == "LOSS") {
          game.status = "LOSS";
          game.finish = new Date().toLocaleString();
          return game;
        }
        else if(newStatus == "TIE") {
          game.status = "TIE";
          game.finish = new Date().toLocaleString();
          return game;
        }

        return game;
    }
    else {
      return new Error("Invalid move.")
    }
  }
  else {
    return new Error("Invalid session or game id.")
  }

}

/* Make a single move */
// PRE: SID, GID, MOVE ALL VALID
function makeMove(game, move, turn) {
  var grid = game.grid
  // full?
  if(grid[0][move] != ' ') {
    return false;
  }
  else {
    // Place piece 
    var piece = (turn == 'Player' ? 'X' : '0');
    // At lowest slot
    for(var i = 4; i >= 0; i--) {
      if (grid[i][move] == ' ') {
        grid[i][move] = piece;
        break;
      }
    }
  }
  return true;
}

// JUST CHECKING HORIZONTALLY AND VERTICALLY FOR NOW
/* Returns status if game ends */
function gameOver(game) {
  var grid = game.grid
  
  var playerCount = 0;
  var computerCount = 0;

  // Horizontal
  for(var row = 0; row < 5; row++) {
    for(var col = 0; col < 7; col++) {
      if(grid[row][col] == 'X') {
        // Player
        computerCount = 0;
        playerCount++;
      }
      else if(grid[row][col] == '0') {
        // CPU
        playerCount = 0;
        computerCount++;
      }
      else {
        playerCount = 0;
        computerCount = 0;
      }

      if(playerCount >= 4) {
        return "VICTORY";
      }
      else if(computerCount >= 4) {
        return "LOSS";
      }

    }
    playerCount = 0;
    computerCount = 0;
  }

  // Vertical
  for(col = 0; col < 7; col++) {
    for(row = 0; row < 5; row++) {
      if(grid[row][col] == 'X') {
        // Player
        computerCount = 0;
        playerCount++;
      }
      else if(grid[row][col] == '0') {
        // Computer
        playerCount = 0;
        computerCount++;
      }
      else {
        playerCount = 0;
        computerCount = 0;
      }

      if(playerCount >= 4) {
        return "VICTORY";
      }
      else if(computerCount >= 4) {
        return "LOSS";
      }

    }
    playerCount = 0;
    computerCount = 0;
  }

  // Diagonal Left to Right Desc
  var diag = checkDiagonalLR(1,0,game);
  if(diag != "") {
    return diag;
  }
  for(col = 0; col < 4; col++) {
    diag = checkDiagonalLR(0,col,game);
    if(diag != "") {
      return diag;
    }
  }

  // Diagonal Right to Left Desc
  var diag = checkDiagonalRL(1,6,game);
  if(diag != "") {
    return diag;
  }
  for(col = 6; col > 2; col--) {
    diag = checkDiagonalRL(0,col,game);
    if(diag != "") {
      return diag;
    }
  }

  // Tie?
  if(boardFull(game)) {
    return "TIE";
  }

  return "";
}

/* Check for a win in the left to right descending diagonal */
function checkDiagonalLR(startRow, startCol, game) {
  var playerCount = 0;
  var computerCount = 0;
  var grid = game.grid;

  var row = startRow;
  var col = startCol;
  while(row < 5 && col < 7) {
    if(grid[row][col] == 'X') {
      // Player
      computerCount = 0;
      playerCount++;
    }
    else if(grid[row][col] == '0') {
      // Computer
      playerCount = 0;
      computerCount++;
    }
    else {
      playerCount = 0;
      computerCount = 0;
    }

    if(playerCount >= 4) {
      return "VICTORY";
    }
    else if(computerCount >= 4) {
      return "LOSS";
    }

    row++;
    col++;
  }
  return "";
}

/* Check for a win in the right to left descending diagonal */
function checkDiagonalRL(startRow, startCol, game) {
  var playerCount = 0;
  var computerCount = 0;
  var grid = game.grid;

  var row = startRow;
  var col = startCol;
  while(row < 5 && col < 7) {
    if(grid[row][col] == 'X') {
      // Player
      computerCount = 0;
      playerCount++;
    }
    else if(grid[row][col] == '0') {
      // Computer
      playerCount = 0;
      computerCount++;
    }
    else {
      playerCount = 0;
      computerCount = 0;
    }

    if(playerCount >= 4) {
      return "VICTORY";
    }
    else if(computerCount >= 4) {
      return "LOSS";
    }

    row++;
    col--;
  }
  return "";
}

/* True if all cells are occupied */
function boardFull(game) {
  var grid = game.grid;

  for(var row = 0; row < 5; row++) {
    for(var col = 0; col < 7; col++) {
      if(grid[row][col] != 'X' && grid[row][col] != '0') {
        return false;
      }
    }
  }
  return true;
}


/* ##################### ROUTES ###################### */

/* Deliver a valid sid */
router.post('/sids', (req, res) => {
    res.header('X-sid', createSid());
    res.send();
});

/* Deliver metadata object */
router.get('/meta', (req, res) => {
    res.send(metadata);
  });
  
/* Deliver list of games associated with sid */
router.get('/sids/:sid', (req, res) => {
    res.send( getGamesBySid(req.params.sid) );
  });

/* Create new game with specified sid */
 router.post('/sids/:sid', (req, res) => {
    res.send( createGame(req.params.sid, req.query.color, req.body.player, req.body.cpu) );
  });  
 
/* Deliver game associated with sid and gid */
router.get('/sids/:sid/gids/:gid', (req, res) => {
    res.send( getGame(req.params.sid, req.params.gid) );
  });

/* Make a move */
router.post('/sids/:sid/gids/:gid', (req, res) => {
    res.send( makeMoveSequence(req.params.sid, req.params.gid, req.query.move) );
  });


module.exports = router;
