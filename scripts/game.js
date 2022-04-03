const zeroEffect = 2; // Remove this many tiles (if possible) and zero out their scores when ZERO is found.
const maxPossibles = 3; // Highlight this many tiles that are not the final number

let oBoard = document.getElementById("game-board"); // The game area container.
let oScore = document.getElementById("game-score"); // The game score container.
let oPower_ShowZero = document.getElementById("btnPower-ShowZero"); // The Show Zero power up button.
let oHelp = document.getElementById("btnHelp"); // The Show Zero power up button.
let oShare = document.getElementById("btnShare"); // The Show Zero power up button.

let boardSize = 25; // How many tiles will display.
let oData = null; // Game array data.
let documentEventListener_Set = false; // Allow for only adding events to document once (if necessary)
let score = 0; // Total score this game
let isGameOver = false; // Is the game over?
let isZeroFound = false; // If zero hasn't been found, there are some things to check in some situations.
let isPowerUsed_ShowZero = false; // If the Show Zero power has been used, you can't use it again.
let isGameRecorded = false; // Is the game score recorded to localStorage already?
let txtShare; // Data to share on social media.
let score_PrevHigh = Score_GetHigh(); // Get the last high score for future use before it is potentially overwritten

let dlgHelp = null;
let dlgGameOver = null;
let dlgResetGame = null;


function Init()
{
    // Build game data
    GenerateGameData();

    // Build the game board
    BuildBoard();

    // Set Game Input Events
    SetEvents();

    // Set initial Score
    RefreshScore(0);

    // Create Help Dialog
    CreateHelpDialog();

    // Create Reset Game Confirmation
    CreateRestartGame();
}

/*
    Generate array of randomized game data
*/
function GenerateGameData()
{
    let tmpData = Array.from({ length: boardSize }, (_, i) => i);
    oData = null;
    oData = [...Shuffle(tmpData)];
}

/*
    Generate the game board
*/
function BuildBoard()
{

    oBoard.innerHTML = "";
    for(let i = 0; i < boardSize; i++)
    {
        let tile = document.createElement("div");
        tile.classList.add("tile");
        tile.innerHTML = "&nbsp;";
        tile.id = `tile_${i}`;
        tile.dataset.pid = i;
        oBoard.appendChild(tile);
    }

}

function SetEvents()
{
    let tiles = oBoard.querySelectorAll("div > .tile");
    tiles.forEach(e => {
        e.addEventListener("click", function(e){
            Tiles_Click(this);
        });
    });

    // We don't want to keep setting the event listener on the document should we have any document level events
    if(!documentEventListener_Set){ documentEventListener_Set = true; }
}

function Tiles_Click(tile, isZeroEffect = false, isAdjacentEffect = false)
{
    if(!tile.classList.contains("tile_open") && !isGameOver)
    {
        let value = oData[tile.dataset.pid];

        tile.classList.remove("tile");
        tile.classList.add("tile_open");
        tile.classList.remove("tile_highlight");
        tile.innerHTML = value;

        if(!isZeroEffect && !isAdjacentEffect)
        {
            Tiles_Check(tile); 
        }
        else if(!isZeroEffect && isAdjacentEffect)
        {
            //RefreshScore(value);
            Tiles_Check(tile, true); 
        }
        else
        {
            tile.classList.add("tile_open_zero");
            tile.title = "Zero Effect, Will Not Be Scored";
        }
    }
}

function Tiles_Check(tile, isAdjacentEffect = false)
{
    let value = oData[tile.dataset.pid];
    
    if(value == boardSize-1)
    {
        // Call Game Over
        SetGameOver();
    }

    if(!isAdjacentEffect)
    {
        if(value == 0)
        {
            // Call to clear random tiles that haven't been cleared yet, their scores are cleared.
            isZeroFound = true;
            oPower_ShowZero.classList.add("icons_disabled");
            Tiles_FoundZero();
        }
    
        Tiles_AdjacentBonusCheck(tile);
    }

    // Any other value is simply scored.
    RefreshScore(value);

}

function Tiles_AdjacentBonusCheck(tile)
{
    let id = tile.dataset.pid;
    let closedTiles = oBoard.querySelectorAll("div > .tile");

    if(closedTiles.length == 0){ return true; }
    
    // Check Right Tile
    if((oData[id+1] == oData[id] + 2 || oData[id+1] == oData[id] - 2) && oData[id+1] != boardSize-1 && ((id+1) % 5) != 0 && document.getElementById("tile_" + (id+1)).classList.contains("tile"))
    {
        Tiles_Click(document.getElementById("tile_" + (id+1)), false, true);
    }

    // Check Left Tile
    if((oData[id-1] == oData[id] + 2 || oData[id-1] == oData[id] - 2) && oData[id-1] != boardSize-1 && (id % 5) != 0 && document.getElementById("tile_" + (id-1)).classList.contains("tile"))
    {
        Tiles_Click(document.getElementById("tile_" + (id-1)), false, true);
    }

    // Check Above Tile
    if((oData[id-5] == oData[id] + 2 || oData[id-5] == oData[id] - 2) && oData[id-5] != boardSize-1 && document.getElementById("tile_" + (id-5)).classList.contains("tile"))
    {
        Tiles_Click(document.getElementById("tile_" + (id-5)), false, true);
    }

    // Check Below Tile
    if((oData[id+5] == oData[id] + 2 || oData[id+5] == oData[id] - 2) && oData[id+5] != boardSize-1 && document.getElementById("tile_" + (id+5)).classList.contains("tile"))
    {
        Tiles_Click(document.getElementById("tile_" + (id+5)), false, true);
    }
}

function Tiles_FoundZero()
{
    let closedTiles = oBoard.querySelectorAll("div > .tile");

    if(closedTiles.length == 0){ return true; }

    if(closedTiles.length <= zeroEffect)
    {
        for(let i = 0; i < closedTiles.length; i++)
        {
            Tiles_Click(closedTiles[i], true);
        }
        SetGameOver();
        return true;
    }
    else
    {
        let randomIndex;
        let lastIndexes = [];
        let maxAttempts = 10000;
        let iAttempts = 0;

        let maxTile = oData.findIndex((v) => v == boardSize-1);

        for(let i = 0; i < zeroEffect; i++)
        {
            iAttempts = 0;
            do
            {
                randomIndex = Math.floor(Math.random() * closedTiles.length);
                iAttempts++;
            }
            while((lastIndexes.includes(randomIndex) || closedTiles[randomIndex].dataset.pid == maxTile) && iAttempts <= maxAttempts)
            
            lastIndexes.push(randomIndex);

            Tiles_Click(closedTiles[randomIndex], true);
        }
    }

    return true;
       
}

function Tiles_ShowPossible()
{
    let closedTiles = oBoard.querySelectorAll("div > .tile");

    if(isGameOver || isPowerUsed_ShowZero || (closedTiles.length <= maxPossibles) || isZeroFound){ return true; }

    let zeroTile = oData.findIndex((v) => v == 0);
    let maxTile = oData.findIndex((v) => v == boardSize-1);
    let possList = [];
    let randomIndex;
    let indexList;
    let iAttempts = 0;
    let maxAttempts = 100;

    indexList = [...closedTiles].map(e => e.dataset.pid);
    possList.push([...closedTiles].map(e => e.dataset.pid).findIndex((v) => v == zeroTile));
    
    for(let i = 0; i < maxPossibles-1; i++)
    {
        do
        {
            randomIndex = Math.floor(Math.random() * closedTiles.length);
            iAttempts++;
        }
        while((possList.includes(randomIndex) || closedTiles[randomIndex].dataset.pid == zeroTile || closedTiles[randomIndex].dataset.pid == maxTile) && iAttempts <= maxAttempts)
        iAttempts = 0;
        possList.push(randomIndex);
    }

    for(let i = 0; i < possList.length; i++)
    {
        closedTiles[possList[i]].classList.add("tile_highlight");
    }

    isPowerUsed_ShowZero = true;
    oPower_ShowZero.classList.add("icons_disabled");

}

function RefreshScore(value)
{
    score += value;
    oScore.innerHTML = score;   
}

/*
    Shuffles a given array of numeric values so they are randomly placed and non-consecutive.
    Sourced From https://stackoverflow.com/questions/60194900/fill-an-array-with-random-non-consecutive-numbers
    Note that every 100 attempts is roughly 1ms, in testing I never had more than 200 attempts running over 500,000 test sets.
*/
function Shuffle(data, maxAttempts = 100000) 
{
    let attempts = 0;
    let array = [...data];
    do
    {
        let currentIndex = array.length;
        let temporaryValue;
        let randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) 
        {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        attempts++;
    }
    //while (array.some((v, i, a) => v + 1 == a[i + 1] || v - 1 == a[i + 1]) && attempts <= maxAttempts)
    while (array.some(CheckShuffle) && attempts <= maxAttempts)
 
    return array;
}

function CheckShuffle(e, i, a)
{
    let result = false;

    // Check if next value is consecutive
    result = e + 1 == a[i + 1] || e - 1 == a[i + 1];
    
    if(!result)
    {
        // Check if previous values were consecutive
        let prevIndex = i-5;
        if(prevIndex >= 0)
        {
            result = a[prevIndex] == e + 1 || a[prevIndex] == e - 1;
        }
    }

    if(!result)
    {
        // Check if previous values were consecutive
        let nextIndex = i-5;
        if(nextIndex < a.length)
        {
            result = a[nextIndex] == e + 1 || a[nextIndex] == e - 1;
        }
    }

    return result;
}

function SetGameOver()
{
    isGameOver = true;
    oPower_ShowZero.classList.add("icons_disabled");
    
    // TODO: Adjust to a promise, but I need to give time for score to calculate before showing game over
    setTimeout(() => { ShowShare() }, 1000);
}

function CreateHelpDialog()
{
    let txtHelp;

    txtHelp = `
        Click on tiles trying to avoid finding ${boardSize-1}.  Finding ${boardSize-1} ends the game.<br/><br/>
        Avoid finding 0.  Finding 0 will result in ${zeroEffect} tiles being opened but not scoring.<br/><br/>
        Use the <span class="material-icons">bolt</span> power up to highlight ${maxPossibles} tiles, one of which is the 0.  The other two are safe tiles.  
        This potentially gives you a lot of information about the game board.  You can use it early or save it for later but there must be at least ${maxPossibles} tiles to open.<br/><br/>
        The tile above, below, to the right, and to the left will never be consecutive.  So if you open a tile with a 5, adjacent tiles will not be a 4 or a 6.  Note that diagonal tiles could be.<br/><br/>
        If you select a tile and the adjacent tile is within 2 value points of the one you selected, it will be opened and scored.  So if you open a tile with a value of 5 and the tile adjacent to it is 3 or 7, they will open up.
        Tiles you open will be scored.<br/><br/>
        What does <i>Numerus Maximus</i> mean?  In Latin, it means <i>Maximum Number</i>.<br/><br/>
        This is was a Ludum Dare #50 Entry.
    `;
    

    let params = {
        textTitle: "Game Help",
        textBody: txtHelp,
        dialogFontSize: "1rem",
        dialogWidth: "50%",
        dialogHeight: "40%"
    }

    dlgHelp = new spDialog(params);
    dlgHelp.dialogTitle.style.height = "7%";
    dlgHelp.dialogBody.style.height = "73%";
    dlgHelp.dialogBody.style.fontSize = ".75rem";
}

async function ShowHelp()
{
    await dlgHelp.ShowDialog();
}

function CreateGameOver()
{
    // Update all scores
    SaveScores();

    let txtBody;
    let scoreAvg = Score_GetAvg();
    let scoreHigh = Score_GetHigh();
    let scoreGames = Score_GetGames();
    
    txtShare = `#NumerusMaximus\r\nCurrent Game: ${score}\r\nCurrent High: ${scoreHigh}\r\nPrevious High: ${score_PrevHigh}\r\nAverage: ${scoreAvg}\r\nGames Played: ${scoreGames}\r\n\r\n#LDJAM `;

    txtBody = "<div style=\"text-align: center\">";

        txtBody += "<b>Current Game</b><br/>";
        txtBody += "<span style=\"color: #29b000; font-weight: bold; font-size: 1.5rem;\">" + score + "</span><br/><br/>";

        txtBody += "<b>Current High Score</b><br/>";
        txtBody += "<span style=\"color: #29b000; font-weight: bold; font-size: 1.5rem;\">" + scoreHigh + "</span><br/><br/>";

        txtBody += "<b>Previous High Score</b><br/>";
        txtBody += "<span style=\"color: #29b000; font-weight: bold; font-size: 1.5rem;\">" + score_PrevHigh + "</span><br/><br/>";

        txtBody += "<b>Average Score</b><br/>";
        txtBody += "<span style=\"color: #29b000; font-weight: bold; font-size: 1.5rem;\">" + scoreAvg + "</span><br/><br/>";

        txtBody += "<b>Games Played</b><br/>";
        txtBody += "<span style=\"color: #29b000; font-weight: bold; font-size: 1.5rem;\">" + scoreGames + "</span><br/><br/>";
        
        txtBody += "<div class=\"material-icons icons\" style=\"margin-top: 2rem;\" onclick=\"SetShare()\" title=\"Copy Scores To Clipboard\">share</div>";

    txtBody += "</div>";

    let params = {
        textTitle: "Stats",
        textBody: txtBody,
        dialogFontSize: "1rem",
        dialogWidth: "45%",
        dialogHeight: "70%",
        showAnswerCancel: false,
        showAnswerFalse: true,
        textAnswerTrue: "Play Again",
        textAnswerFalse: "Close"
    }

    dlgGameOver = new spDialog(params);
    dlgGameOver.dialogTitle.style.height = "7%";
    dlgGameOver.dialogBody.style.height = "73%";
    dlgGameOver.answerTrue.style.fontSize = "1.25rem";
    dlgGameOver.answerFalse.style.fontSize = "1.25rem";
    dlgGameOver.dialogTitle.style.fontSize = "1.25rem";
}

async function ShowGameOver()
{
    await dlgGameOver.ShowDialog().then(result => {
        if(dlgGameOver.userResponse == 1)
        {
            setTimeout(()=>{location.reload()}, 500); // Give the dialog a chance to close to avoid weird flashing.
        }
    });
}

function ShowShare()
{
    CreateGameOver();
    ShowGameOver();
}

function SetShare()
{
    CopyToClipboard(txtShare);
}

function CopyToClipboard(value)
{
    navigator.clipboard.writeText(value);
}

function SaveScores()
{
    // Don't overwrite scores over and over
    if(isGameRecorded || !isGameOver){ return true; }

    let scoreGames = Score_GetGames();
    let scoreHigh = Score_GetHigh();
    let scoreAvg = Score_GetAvg();

    if(scoreHigh < score)
    {
        localStorage.score_high = score;
    }

    localStorage.score_games = scoreGames + 1;
    localStorage.score_avg = parseFloat(((scoreAvg * scoreGames) + score) / (scoreGames + 1)).toFixed(2);

    isGameRecorded = true;
    
    return true;
}

function Score_GetHigh()
{
    if(localStorage.score_high)
    {
        return parseInt(localStorage.score_high);
    }
    else
    {
        return 0;
    }
}

function Score_GetGames()
{
    if(localStorage.score_games)
    {
        return parseInt(localStorage.score_games);
    }
    else
    {
        return 0;
    }
}

function Score_GetAvg()
{
    if(localStorage.score_avg)
    {
        return parseFloat(localStorage.score_avg);
    }
    else
    {
        return 0;
    }
}

function Score_ResetAll()
{
    localStorage.score_games = 0;
    localStorage.score_avg = 0;
    localStorage.score_high = 0;
}

function CreateRestartGame()
{
    let params = {
        textTitle: "Restart Game?",
        textBody: "Are you sure you want to restart?  Current game progress will be lost.",
        showAnswerCancel: false,
        showAnswerFalse: true
    }

    dlgResetGame = new spDialog(params);
}

function CheckRestartGame()
{
    // If game is over, no need to question the refresh.
    if(isGameOver){ location.reload(); return true; }

    RestartGame();
}

async function RestartGame()
{
    await dlgResetGame.ShowDialog().then(result => {
        if(dlgResetGame.userResponse == 1)
        {
            setTimeout(()=>{location.reload()}, 500); // Give the dialog a chance to close to avoid weird flashing.
        }
    });
}