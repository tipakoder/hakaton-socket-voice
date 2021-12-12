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
    #chats;
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

        // Set events to io
        this.#io.on("connection", async (client) => {
            console.log(colors.blue(`SOCKET USER CONNECTED`));

            const req = client.handshake;
            let account;

            try{
                account = await verifyToken(req);
            } catch (e) {
                if(e["getJson"]){
                    client.emit("disconnected", e.getJson());
                } else {
                    client.emit("disconnected", e.toString());
                }

                client.disconnect();
            }

            client.emit("connected", "You're was connected");

            client.on("join room", async (chat_id) => {
                console.log(chat_id)
                if(this.#chats[chat_id]) {
                    this.#chats[chat_id].push(client.id);
                } else {
                    this.#chats[chat_id] = [client.id];
                }

                const otherUser = this.#chats[chat_id].find(id => id !== client.id);
                if(otherUser) {
                    client.emit("other user", otherUser);
                    this.#io.to(chat_id).emit("user joined", client.id);
                }

                client.emit("joined", "You're was added to room");
                client.join(chat_id);
            });

            client.on("offer", payload => {
                this.#io.to(payload.chat_id).emit("offer", payload);
            });

            client.on("answer", payload => {
                this.#io.to(payload.chat_id).emit("answer", payload);
            });

            client.on("ice-candidate", incoming => {
                this.#io.to(incoming.chat_id).emit("ice-candidate", incoming.candidate);
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