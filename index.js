// Include environment
require("dotenv").config();

// Include database
global.dbConnection = require("./app/main/database/connection");
global.dbModels = require("./app/main/database/models");

// Global paths
global.rootPath = __dirname;

// Sync
if(process.argv.indexOf("--sync") !== -1) {
    return global.dbConnection.sync({force: true});
}

// Start servers
const SocketServer = require("./app/main/socketServer");
const HttpServer = require("./app/main/httpServer");

// Http server
const httpServer = new HttpServer();
httpServer.start();

// Socket server
const socketServer = new SocketServer();
socketServer.start();