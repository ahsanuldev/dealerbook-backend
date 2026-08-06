import { ErrorRequestHandler } from "express";

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = "Something went wrong!";
    let errorMessages: { path: string | number; message: string }[] = [];

    if (error?.name === "ValidationError") {
        message = "Validation Error";
    } else if (error instanceof Error) {
        message = error?.message;
        errorMessages = error?.message
            ? [{ path: "", message: error?.message }]
            : [];
    }

    res.status(statusCode).json({
        success: false,
        message,
        errorMessages,
        stack: process.env.NODE_ENV !== "production" ? error?.stack : undefined,
    });
};

export default globalErrorHandler;
