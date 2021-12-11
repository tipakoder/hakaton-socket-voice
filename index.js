// Include environment
require("dotenv").config();

// Include database
global.dbConnection = require("./app/main/database/connection");
global.dbModels = require("./app/main/database/models");

// Global paths
global.rootPath = __dirname;

// Sync
if(process.argv.indexOf("--sync") !== -1) {
    return global.dbConnection.sync({force: true}).then(async () => {
        await global.dbModels.Account.create(
            {
                nickname: "Nikita",
                email: "staryliss.nikita.2004@gmail.com",
                password: require("bcrypt").hashSync("123123", 2)
            }
        );

        global.dbConnection.close();
    });
}

// Start servers
const SocketServer = require("./app/main/server/socket");
const HttpServer = require("./app/main/server/http");

// Http server
const httpServer = new HttpServer();
httpServer.start();

// Socket server
const socketServer = new SocketServer();
socketServer.start();