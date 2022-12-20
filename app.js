const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

app.use(express.json());

let db = null;

//Initialize server
let initialize = async () => {
  try {
    let dbPath = path.join(__dirname, "cricketMatchDetails.db");

    db = await open({ filename: dbPath, driver: sqlite3.Database });

    app.listen(3000, () => console.log("Server is Online"));
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initialize();

//API 1
app.get("/players/", async (request, response) => {
  let query = `SELECT * FROM player_details`;

  let result = await db.all(query);

  function converter(obj) {
    return {
      playerId: obj.player_id,
      playerName: obj.player_name,
    };
  }

  response.send(result.map((obj) => converter(obj)));
});

//API 2
app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT * FROM player_details WHERE player_id = ${playerId}`;

  let result = await db.get(query);

  function converter(obj) {
    return {
      playerId: obj.player_id,
      playerName: obj.player_name,
    };
  }

  response.send(converter(result));
});

//API 3
app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const query = `UPDATE player_details SET 
        player_name = '${playerName}' WHERE player_id = ${playerId}`;

  await db.run(query);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const query = `SELECT * FROM match_details WHERE match_id = ${matchId}`;

  let result = await db.get(query);

  function converter(obj) {
    return {
      matchId: obj.match_id,
      match: obj.match,
      year: obj.year,
    };
  }

  response.send(converter(result));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT match_details.match_id AS matchId, 
      match_details.match, match_details.year
      FROM match_details JOIN player_match_score ON 
      match_details.match_id = player_match_score.match_id 
      WHERE player_id = ${playerId};`;

  let result = await db.all(query);

  response.send(result);
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const query = `SELECT player_details.player_id AS playerId, 
                          player_details.player_name AS playerName
      FROM player_details JOIN player_match_score ON 
            player_details.player_id = player_match_score.player_id 
      WHERE match_id = ${matchId};`;

  let result = await db.all(query);

  response.send(result);
});

//API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT player_details.player_id AS playerId, 
                          player_details.player_name AS playerName,
                          SUM(player_match_score.score) AS totalScore,
                          SUM(player_match_score.fours) AS totalFours,
                          SUM(player_match_score.sixes) AS totalSixes
      FROM player_details JOIN player_match_score ON 
            player_details.player_id = player_match_score.player_id 
      WHERE playerId = ${playerId}
      GROUP BY playerId;`;

  let result = await db.get(query);

  response.send(result);
});

//module export
module.exports = app;
