const http = require("http");
const colors = require("colors");
const express = require("express");
const {Server} = require("socket.io");

class SocketServer {
    #io;
    #app;
    #port;
    #server;

    /**
     * Initialize needle components
     */
    constructor(port = 8181) {
        this.#port = port;

        this.#app = express();
        this.#server = http.createServer(this.#app,
            {
                cors:{
                    origin: "*",
                    credentials: true
                },
                transports: ['websocket']
            }
        );

        this.#io = new Server(this.#server);
    }

    /**
     * Setter port
     * @param port
     */
    setPort(port = 8181) {
        this.#port = port;
    }

    /**
     * Start socket server
     */
    start() {
        this.#server.listen(this.#port, () => {
            console.log(colors.rainbow(`Socket server was started on :${this.#port}`));
        })
    }
}

module.exports = SocketServer;