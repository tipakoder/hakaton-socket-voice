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
                cors:{
                    origin: "https://127.0.0.1:80",
                    credentials: true
                },
                transports: ['websocket']
            }, this.#app)
        } else {
            this.#server = http.createServer(this.#app,
                {
                    cors:{
                        origin: "*",
                        credentials: true
                    },
                    transports: ['websocket']
                }
            );
        }


        this.#io = new Server(this.#server);

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

            client.on("join room", async (chat_id) => {
                if(typeof chat_id === "undefined")
                    throw new ApiError(400, "Chat id undefined");

                const existsChat = await Chat.findByPk(chat_id);

                if(!existsChat)
                    throw new ApiError(400, "Chat with input id is not found");

                if(this.#chats[chat_id]) {
                    this.#chats[chat_id].push(client);
                } else {
                    this.#chats[chat_id] = [client];
                }

                const otherUser = this.#chats[chat_id].find(id => id !== client.id);
                if(otherUser) {
                    this.#io.to(chat_id).emit("user joined", client.id);
                }

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