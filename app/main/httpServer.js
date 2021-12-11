const fs = require("fs");
const path = require("path");
const cors = require("cors");
const colors = require("colors");
const express = require("express");

class HttpServer {
    #app;
    #port;

    /**
     * Initialize needle components
     */
    constructor(port = 8080) {
        this.#port = port;

        this.#app = express();
        this.#app.use(cors());

        this.#app.use(`/:module/:action`, this.routing);
        this.#app.use((req, res) => {
            res.status(404).json({type: "error", code: 404, message: "Invalid request"});
        });
    }

    /**
     * Setter port
     * @param port
     */
    setPort(port = 8080) {
        this.#port = port;
    }

    /**
     * Routing of methods
     * @param req
     * @param res
     * @param next
     */
    async routing(req, res, next) {
        let moduleName = req.params.module;
        let actionName = req.params.action;
        let modulePath = path.join(global.rootPath, "app", "module", `${moduleName}.js`);

        if(fs.existsSync(modulePath)) {
            let module = require(modulePath);

            if(module[actionName]) {
                try {
                    return res.json(
                        {
                            type: "success",
                            data: await module[actionName](req)
                        }
                    ).end();
                } catch (e) {
                    if(e["getJson"]) {
                        let errorJson = e.getJson();
                        return res.status(errorJson.code).json(errorJson).end();
                    }

                    return res.end(e.toString());
                }
            }
        }

        next();
    }

    /**
     * Start socket server
     */
    start() {
        this.#app.listen(this.#port, () => {
            console.log(colors.rainbow(`Http server was started on :${this.#port}`));
        })
    }
}

module.exports = HttpServer;