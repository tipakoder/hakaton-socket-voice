const http = require("http");
const colors = require("colors");
const express = require("express");
const {Server} = require("socket.io");

const ApiError = require("../apiError");
const {Chat} = require("../database/models");

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

            client.on("add_user", async(msg) => {
                try{
                    const chat_id = msg.chat_id;

                    if(typeof chat_id === "undefined")
                        throw new ApiError(400, "Chat id undefined");

                    const existsChat = await Chat.findByPk(chat_id);

                    if(!existsChat)
                        throw new ApiError(400, "Chat with input id is not found");

                    client.join(msg.chat_id);
                } catch (e) {
                    if(e["getJson"]){
                        client.emit("disconnected", e.getJson());
                    } else {
                        client.emit("disconnected", e.toString());
                    }

                    client.disconnect();
                }
            });

            client.on("chat_message", async(msg) => {
                this.#io.emit('chat_message', msg);
            });

            client.on("voice_sent", async(msg) => {
                this.#io.emit('voice_received', msg);
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