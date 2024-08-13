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
import cors from 'cors';
import { corsOptions } from './config/corsOptions';

dbConnect();

const app: Express = express();
const port = process.env.PORT || 5050;

app.use(json());
app.use(cors(corsOptions));
app.use(urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Natalius API is active').json({ message: 'Natalius API is active' });
});

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

// eslint-disable-next-line no-unused-vars
app.use((error: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Express Error Middleware: ', error);
  if (error instanceof HttpErrorResponse) {
    res.status(error.status).json({ message: error.message });
  }
  res.status(500).json({ message: 'Internal Server Error', error });
});

connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(port, () => console.log(`Server running oooh so smoothly at http://localhost:${port}`));
});
