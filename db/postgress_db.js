const { Pool, types } = require("pg");

types.setTypeParser(types.builtins.INT8, (value) => {
  return parseInt(value);
});

types.setTypeParser(types.builtins.FLOAT8, (value) => {
   return parseFloat(value);
});

types.setTypeParser(types.builtins.NUMERIC, (value) => {
   return parseFloat(value);
});

const pool = new Pool({
  user: "postgres",
  password: "Kamal1675.",
  host: "localhost",
  port: 5432,
  database: "shop",
  max: 50,
});

async function getConnection() {
  const connection = await pool.connect();
  return connection
} 

async function query(qry, connection = null) {
  let output = null;
  try {
    if (connection !== null) {
      // const connection = await pool.connect();
      output = await connection.query(qry);
    } else {
      output = await pool.query(qry);
    }
  } catch (e) {
    console.log(qry);
    console.log(e);
  }
  return { rows: output.rows, fields: output.fields };
}

pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
});
pool.on("disconnect", (err, client) => {
  console.log("...Db Disconnected...");
});


module.exports = {query, getConnection};
