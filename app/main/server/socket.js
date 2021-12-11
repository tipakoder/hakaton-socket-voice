const http = require("http");
const colors = require("colors");
const express = require("express");
const {Server} = require("socket.io");

const ApiError = require("../apiError");

class Socket {
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

        // Set events to io
        this.#io.on("connection", (client) => {
            console.log(colors.blue(`SOCKET USER CONNECTED`));

            client.on("add_user", (msg) => {
                const room_id = msg.room_id;

                if(typeof room_id === "undefined")
                    throw new ApiError(400, "Room id undefined");

                

                client.join(msg.room_id);
            });
        });
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

module.exports = Socket;