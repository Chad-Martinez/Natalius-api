import express, { Request, Express, Response, NextFunction, urlencoded, json } from 'express';
import HttpErrorResponse from './classes/HttpErrorResponse';
import dbConnect from './db/conn';
import authRoutes from './routes/authRoutes';
import gigRoutes from './routes/gigRoutes';
import shiftRoutes from './routes/shiftRoutes';
import incomeRoutes from './routes/incomeRoutes';
import vendorRouters from './routes/vendorRoutes';
import expenseRoutes from './routes/expenseRoutes';

dbConnect();

const app: Express = express();
const port = process.env.PORT || 5050;

app.use(json());
app.use(urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => res.send('Ooooh Yea!'));

app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/vendors', vendorRouters);
app.use('/api/expenses', expenseRoutes);

// eslint-disable-next-line no-unused-vars
app.use((error: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Express Error Middleware: ', error);
  if (error instanceof HttpErrorResponse) {
    res.status(error.status).json({ message: error.message });
  }
  res.status(500).json({ message: 'Internal Server Error', error });
});

app.listen(port, () => console.log(`Server running oooh so smoothly at http://localhost:${port}`));
