/************* GLOBALS *************/
var pageView = "home"   // Current page view
// Session Data
var sid = -1;
var curGame;
var gamesById = {}; // {gid:game, gid:game, ....} for this session's games
var meta;
var gifs = {
    victory: 'https://thumbs.gfycat.com/DefiantDelightfulJay-size_restricted.gif',
    loss: 'https://media.tenor.com/PMiHeepn1k4AAAAC/no-screaming.gif',
    tie: 'https://media.tenor.com/rIAM9GA9gJwAAAAd/stormtrooper-star-wars.gif'
};
var tokensId = {}; // {tid:token, tid:token} for easy lookup

/*********** END GLOBALS ***********/


/* Load Metadata and Games list */
function loadData() {
    // Fetch metadata
    fetch('connectfour/api/v1/meta')
        .then(res => res.json())
        .then(data => setDefaults(data));

    // Fetch sid
    fetch('connectfour/api/v1/sids', {method: 'POST'})
        .then((response) => {
            for (var pair of response.headers.entries()) {
                if (pair[0].toLowerCase() == 'x-sid')  {
                    sid = pair[1];
                }
            }});
}

/* Set selectable options and default options */
function setDefaults(json) {
    meta = json;
    // Set token options
    $.each(json.tokens, function (i, item) {
        $('#player-select').append($('<option>', { 
            value: item.id,
            text : item.name 
        }));
    }); 
    $.each(json.tokens, function (i, item) {
        $('#computer-select').append($('<option>', { 
            value: item.id,
            text : item.name 
        }));
    }); 

    // Set default tokens
    var playerIcon = json.default.playerToken.id
    var cpuIcon = json.default.computerToken.id
    $("#player-select option[value=" + playerIcon + "]").attr('selected', 'selected');
    $("#computer-select option[value=" + cpuIcon + "]").attr('selected', 'selected');

    // Set default color
    color = json.default.color
    $('#colorInput').val(color);

    // Create Token Object
    meta.tokens.forEach(token => tokensId[token.id] = token);
}

/* Change what view is being displayed */
function changeView() {
    if(pageView == "home") {
        $(".homeView").css("display", "none");
        $(".gameView").css("display", "block");
        pageView = "game";
    }
    else {
        $(".gameView").css("display", "none");
        $(".homeView").css("display", "block");
        clearGame();
        resetButtons();
        addGames();
        pageView = "home";
    }  
}

function clearBoard() {
    $('.cell img').remove();
}

function clearBoardIcons() {
    $('.cell-place img').remove();
}

function clearGame() {
    clearBoard();
    clearBoardIcons();
}

/* Populates the board cells with tokens*/
function fillBoard(game) {
    gamesById[game.id] = game;
    curGame = game;
    $("#game-status").text(game.status);

    // Loop through game grid, set images accordingly
    clearBoard();
    var grid = game.grid;
    var playerIcon = getIcon(game.theme.playerToken).url;
    var cpuIcon = getIcon(game.theme.computerToken).url;

    for(var row = 0; row < 5; row++) {
        for(var col = 0; col < 7; col++ ) {
            if(grid[row][col] == 'X') {
                // Player
                $('#r'+row+'c'+col).append('<img src=' + playerIcon + ' class="grid-img">');
            }
            else if(grid[row][col] == "0") {
                // CPU
                $('#r'+row+'c'+col).append('<img src=' + cpuIcon + ' class=grid-img>');
            }
        }
    }

    // Have to do some extra work if the game is complete
    if(gameIsDone(game)) {
        if(game.status == "VICTORY") {
            gameOver("VICTORY", gifs.victory);
        }
        else if(game.status == "LOSS") {
            gameOver("LOSS", gifs.loss);
        }
        else if(game.status == "TIE") {
            gameOver("TIE", gifs.tie);
        }
    }
}

/* Add gif, change text */
function gameOver(status, gif) {
    $("#game-status").text(status);
    $(".cell-hover").remove();
    if(!($(".gif").length)) {
        $(".grid-header").append('<img class="gif" src=' + gif + '>');
    }
}

/* Put the cell buttons back */
function resetButtons() {
    $(".gif").remove();
    if(!($(".cell-hover").length)) {
        $(".grid-header").append('<div class="cell-hover"><button type="button" class="cell-place" onclick="placePiece(0)"></button></div>'+
        '<div class="cell-hover"><button type="button" class="cell-place" onclick="placePiece(1)"></button></div>' +
        '<div class="cell-hover"><button type="button" class="cell-place" onclick="placePiece(2)"></button></div>' +
        '<div class="cell-hover"><button type="button" class="cell-place" onclick="placePiece(3)"></button></div>' +
        '<div class="cell-hover"><button type="button" class="cell-place" onclick="placePiece(4)"></button></div>' +
        '<div class="cell-hover"><button type="button" class="cell-place" onclick="placePiece(5)"></button></div>' +
        '<div class="cell-hover"><button type="button" class="cell-place" onclick="placePiece(6)"></button></div>');
    }
}

function gameIsDone(game) {
    return game.status == "VICTORY" || game.status == "LOSS" || game.status == "TIE";
}

/* Get a new game object from the server */
function createGame() {
    // Get Values
    var playerIcon = $('#player-select').find(":selected").val();
    var cpuIcon = $('#computer-select').find(":selected").val();
    if (playerIcon == cpuIcon) {
        // Make user select different option
        return;
    }
    var color = $('#colorInput').val();

    // Create game
    fetch('connectfour/api/v1/sids/' + sid + '?' + new URLSearchParams({color : color}), {method: 'POST', headers: { 'Content-Type' : 'application/json'} , body : JSON.stringify({player : playerIcon, cpu: cpuIcon})})
        .then(res => res.json())
        .then(game => { 
            gamesById[game.id] = game;
            gameplay(game);
        })
    
}

/* Main gameplay function, set appropriate settings for the current game */
function gameplay(game) {
    // Setup game view
    fillBoard(game);
    $('.grid').css("background-color", game.theme.color);
    var picon = getIcon(game.theme.playerToken);
    $('.cell-place').append('<img src=' + picon.url + '></img>');
    changeView();

    // We can begin gameplay
    curGame = game;
}

/* Tell the server to make a move */
function placePiece(column) {
    // Post move
    fetch('connectfour/api/v1/sids/' + sid + '/gids/' + curGame.id + '?' + new URLSearchParams({move : column}), {method: 'POST'})
        .then(res => res.json())
        .then(fillBoard);
}

/* Function of the view buttons */
function view(id) {
    clearGame();
    gameplay(gamesById[id]);
}

/* Add a row in the games list table */
function addTableRow(game) {
    var picon = getIcon(game.theme.playerToken);
    var cicon = getIcon(game.theme.computerToken);
    var finish = "";
    if(game.finish) {
        finish = game.finish;
    }

    $('table tbody').append('<tr>' +
        '<td>' + game.status + '</td>'+
        '<td><div class="icon"> <img src=' + picon.url + ' class="tableimg"></div></td>' +
        '<td><div class="icon"> <img src=' + cicon.url + ' class="tableimg"></div></td>' +
        '<td>' + game.start + '</td>'+
        '<td>' + finish + '</td>'+
        '<td><button type="button" class="btn" onclick = view("'+game.id+'") style="background-color:' + game.theme.color + ';">view</button></td></tr>');
}

/* Fill the games table */
function addGames() {
    $("tbody tr").remove();
    for(game of Object.values(gamesById)) {
        addTableRow(game);
    }
}

function getIcon(id) {
    return tokensId[id];
}