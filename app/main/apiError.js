class ApiError {
    code;
    message;

    /**
     * Constructor
     * @param code
     * @param message
     */
    constructor(code, message) {
        this.code = code;
        this.message = message;
    }

    /**
     * Get error by JSON format
     */
    getJson() {
        return {
            code: this.code,
            message: this.message
        };
    }

    /**
     * Forbidden access 403 ERROR
     * @param message
     * @return {ApiError}
     */
    static forbidden(message = "Forbidden access") {
        return new ApiError(403, message);
    }

    /**
     * Not found 404 ERROR
     * @param message
     * @return {ApiError}
     */
    static notFound(message = "Page not found") {
        return new ApiError(404, message);
    }
}

module.exports = ApiError;