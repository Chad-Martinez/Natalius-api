import express, { Request, Express, Response, NextFunction, urlencoded, json } from 'express';
import { connection } from 'mongoose';
import HttpErrorResponse from './classes/HttpErrorResponse';
import dbConnect from './db/conn';
import cookieParser from 'cookie-parser';
import verifyJWT from './middleware/verifyJwt';
import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import profileRoutes from './routes/profileRoutes';
import clubRoutes from './routes/clubRoutes';
import shiftRoutes from './routes/shiftRoutes';
import incomeRoutes from './routes/incomeRoutes';
import vendorRouters from './routes/vendorRoutes';
import expenseRoutes from './routes/expenseRoutes';
import tokenRoutes from './routes/tokenRoutes';
import sprintRoutes from './routes/sprintRoutes';
import imageRoutes from './routes/imageRoutes';
import { allowedOrigins } from './config/allowedOrigins';

dbConnect();

const app: Express = express();
const port = parseInt(process.env.PORT || '5050', 10);

console.log('env ', process.env.NODE_ENV);

app.use(cookieParser());

const setCorsHeaders = (req: Request, res: Response, next: NextFunction): void | Response => {
  const origin = req.headers.origin;

  if (!origin) {
    return next();
  }

  if (!allowedOrigins.includes(origin)) {
    console.warn('Blocked origin:', origin);
    return res.status(403).json({ message: 'CORS policy does not allow access from this origin' });
  }

  res.setHeader('Access-Control-Allow-Origin', origin);

  res.header('Access-Control-Allow-Credentials', 'true');

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Origin, Accept, X-Requested-With');

  res.header('Access-Control-Expose-Headers', 'Set-Cookie');

  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, content-type, Origin, Accept, X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    return res.status(204).end();
  }

  return next();
};

app.use(setCorsHeaders);

app.use(json());
app.use(urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);

app.use(verifyJWT);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/vendors', vendorRouters);
app.use('/api/expenses', expenseRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/images', imageRoutes);

// eslint-disable-next-line no-unused-vars
app.use((error: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('Express Error Middleware:', error);
  if (error instanceof HttpErrorResponse) {
    res.status(error.status).json({ message: error.message });
  } else {
    res.status(500).json({ message: 'Internal Server Error', error: error.message || error });
  }
});

connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(port, '0.0.0.0', () => console.log(`Server running oooh so smoothly on Port:${port}`));
});
