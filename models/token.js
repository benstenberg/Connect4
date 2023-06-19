const { v4: uuidv4 } = require('uuid');

class Token {
   constructor( name, url) {
    this.name = name;
    this.url = url;
    this.id = uuidv4();
   }
}

module.exports = Token;
