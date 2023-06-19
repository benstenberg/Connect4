const { v4: uuidv4 } = require('uuid');

class Game {
   constructor( theme, status, start, finish, grid ) {
      this.theme = theme;
      this.status = status;  // UNFINISHED, LOSS, VICTORY, TIE
      this.start = start;
      this.finish = finish;
      this.grid = grid;  // LIst of lists in row major order
      this.id = uuidv4();
   }
}

module.exports = Game;
