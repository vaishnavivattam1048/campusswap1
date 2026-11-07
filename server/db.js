const oracledb = require("oracledb");

const dbConfig = {
    user: "system",
    password: "6699",
    connectString: "localhost:1521/xepdb1"
};

async function getConnection() {
    return await oracledb.getConnection(dbConfig);
}

module.exports = { getConnection };