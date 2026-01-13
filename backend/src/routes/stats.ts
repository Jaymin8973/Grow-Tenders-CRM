import { Router } from 'express';
import { auth } from '../middleware';
import {
    getDashboardStats,
    getPipelineStats,
    getLeaderboard,
    getRecentActivity,
    getTodaysTasks,
    getRevenueData
} from '../controllers/statsController';

const router = Router();

// All routes require authentication
router.use(auth);

// Dashboard stats
router.get('/dashboard', getDashboardStats);

// Pipeline stats
router.get('/pipeline', getPipelineStats);

// Leaderboard
router.get('/leaderboard', getLeaderboard);

// Recent activity
router.get('/activity', getRecentActivity);

// Today's tasks
router.get('/tasks/today', getTodaysTasks);

// Revenue data for charts
router.get('/revenue', getRevenueData);

export default router;
