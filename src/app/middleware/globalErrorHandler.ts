import { ErrorRequestHandler } from "express";
import status from "http-status";
import { ZodError } from "zod";
import AppError from "../errorHelpers/AppError";

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = "Something went wrong!";
    let errorMessages: { path: string | number; message: string }[] = [];

    if (error instanceof ZodError) {
        statusCode = status.BAD_REQUEST;
        message = "Validation Error";
        errorMessages = error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
        }));
    } else if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
        errorMessages = [{ path: "", message: error.message }];
    } else if (error?.name === "ValidationError") {
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
