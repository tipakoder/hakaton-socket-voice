const fs = require("fs");
const http = require("http");
const https = require("https");
const colors = require("colors");
const express = require("express");
const {Server} = require("socket.io");

const ApiError = require("../apiError");
const {Chat} = require("../database/models");
const {verifyToken} = require("../../module/account");

class Socket {
    #io;
    #app;
    #port;
    #chats = {};
    #server;

    /**
     * Initialize needle components
     */
    constructor(port = 8181) {
        this.#port = port;

        this.#app = express();

        if(parseInt(process.env.HTTPS) === 1) {
            this.#server = https.createServer({
                key: fs.readFileSync("server.key"),
                cert: fs.readFileSync("server.cert"),
            }, this.#app)
        } else {
            this.#server = http.createServer(this.#app);
        }


        this.#io = new Server(this.#server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            transports: ["websocket"]
        });

        const rooms = {};

        this.#io.on("connection", socket => {
            socket.on("join room", roomID => {
                if (rooms[roomID]) {
                    rooms[roomID].push(socket.id);
                } else {
                    rooms[roomID] = [socket.id];
                }
                const otherUser = rooms[roomID].find(id => id !== socket.id);
                if (otherUser) {
                    socket.emit("other user", otherUser);
                    socket.to(otherUser).emit("user joined", socket.id);
                }
            });

            socket.on("offer", payload => {
                this.#io.to(payload.target).emit("offer", payload);
            });

            socket.on("answer", payload => {
                this.#io.to(payload.target).emit("answer", payload);
            });

            socket.on("ice-candidate", incoming => {
                this.#io.to(incoming.target).emit("ice-candidate", incoming.candidate);
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