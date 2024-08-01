class ExpressError extends Error {
    constructor(statusCode, message) {
        // To call the constructor of the Error class.
        super();

        // Express' built-in error handling middleware function looks for the
        // value of the statusCode property within the corresponding error
        // object (err.statusCode) to set the value of res.statusCode. If
        // err.statusCode is undefined or invalid, then Express uses a default
        // value of 500 to set the value of res.statusCode.
        // Within custom error handling middleware functions, we set the value
        // of res.statusCode manually by using the res.status() method.
        this.statusCode = statusCode;

        // Express' built-in error handling middleware function sets the value
        // of res.statusMessage according to the status code, and doesn't care
        // about any property within the corresponding error object holding
        // the error message, such as err.message.
        // However, err.message can be useful within custom error handling
        // middleware functions.
        // Moreover, the built-in Error class has a property called message,
        // and this.message refers to the property inherited from Error, to
        // which the value of message gets assigned because of this statement.
        this.message = message;

        // The value of the message propery of a built-in error object is set by
        // the corresponding built-in thrower of that error.
        // However, not every built-in thrower sets the value of the statusCode
        // property, as statusCode doesn't belong to the built-in Error class.
    }
}

module.exports = ExpressError;
