const { OPEN_READWRITE } = require('sqlite3');
const sqlite = require("sqlite3").verbose();


function DbConnection() {
    return new sqlite.Database("./app.db", OPEN_READWRITE, (err) => {
        if (err) {
            console.log(err.message)
        }
    });
}



module.exports = DbConnection;


