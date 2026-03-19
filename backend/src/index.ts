import express from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth';
import gradingRoutes from './routes/grading';
import gradeReviewRoutes from './routes/gradeReview';
import gradeReleaseRoutes from './routes/gradeRelease';
import submissionRoutes from './routes/submissions';
import gradebookRoutes from './routes/gradebook';
import studentGradesRoutes from './routes/studentGrades';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/grading', gradingRoutes);
app.use('/api/grades', gradeReviewRoutes);
app.use('/api/grade-release', gradeReleaseRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/gradebook', gradebookRoutes);
app.use('/api/my-grades', studentGradesRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n  PreGrade API running on http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health\n`);
});

export default app;
