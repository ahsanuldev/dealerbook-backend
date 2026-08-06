import { NextFunction, Request, Response } from "express";
import z from "zod";

export const validateRequest = (zodSchema: z.ZodObject<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // If data is sent as a JSON string in a 'data' field (common in form-data uploads)
        if (req.body?.data && typeof req.body.data === "string") {
            try {
                req.body = JSON.parse(req.body.data);
            } catch (error) {
                return next(new Error("Invalid JSON in 'data' field"));
            }
        }

        // Schemas wrap their fields in `body` / `query` keys, so parse the whole request shape
        const parsedResult = zodSchema.safeParse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        if (!parsedResult.success) {
            return next(parsedResult.error);
        }

        // Sanitizing and updating req with validated data
        if (parsedResult.data.body) {
            req.body = parsedResult.data.body;
        }
        if (parsedResult.data.query) {
            // req.query is a getter in Express 5 — mutate in place instead of reassigning
            Object.keys(req.query).forEach((key) => delete req.query[key]);
            Object.assign(req.query, parsedResult.data.query);
        }

        next();
    };
};
