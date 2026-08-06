import express from 'express';
import { AuthRoutes } from '../module/auth/auth.route';
import { DealerRoutes } from '../module/dealer/dealer.route';
import { UserRoutes } from '../module/user/user.route';

const router = express.Router();

const moduleRoutes = [
    {
        path: '/auth',
        route: AuthRoutes,
    },
    {
        path: '/dealers',
        route: DealerRoutes,
    },
    {
        path: '/users',
        route: UserRoutes,
    },
    // Add more routes here...
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;
