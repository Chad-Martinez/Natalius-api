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
import cors from 'cors';
import { corsOptions } from './config/corsOptions';
import { allowedOrigins } from './config/allowedOrigins';

dbConnect();

const app: Express = express();
const port = parseInt(process.env.PORT || '5050', 10);

app.use(cors(corsOptions), (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[CORS ERROR]', err);
  res.status(500).send('CORS Configuration Error');
});

// app.options('*', cors(corsOptions));

app.options('*', (req, res) => {
  console.log('OPTIONS request received:', req.headers.origin);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Origin, Accept, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).end(); // No Content for preflight
});

app.use(cookieParser());

// const setCorsHeaders = (req: Request, res: Response, next: NextFunction): void | Response => {
//   const origin = req.headers.origin;

//   if (!origin) {
//     return next();
//   }

//   if (!allowedOrigins.includes(origin)) {
//     console.warn('Blocked origin:', origin);
//     return res.status(403).json({ message: 'CORS policy does not allow access from this origin' });
//   }

//   res.setHeader('Access-Control-Allow-Origin', origin);
//   // Allow credentials
//   res.header('Access-Control-Allow-Credentials', 'true');

//   // Allow Methods
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

//   // Allow Headers
//   // res.header(
//   //   'Access-Control-Allow-Headers',
//   //   'Authorization, Content-Type, Origin, Accept, X-Requested-With, Access-Control-Request-Method, Access-Control-Request-Headers, Access-Control-Allow-Origin',
//   // );
//   res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Origin, Accept, X-Requested-With');

//   // Expose Headers
//   res.header('Access-Control-Expose-Headers', 'Set-Cookie');

//   // Handle OPTIONS preflight
//   // if (req.method === 'OPTIONS') {
//   //   return res.status(204).end();
//   // }
//   if (req.method === 'OPTIONS') {
//     console.log('Handling OPTIONS request for:', req.headers.origin);
//     res.header('Access-Control-Allow-Origin', origin);
//     res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Origin, Accept, X-Requested-With');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
//     return res.status(204).end(); // No Content for preflight
//   }

//   return next();
// };

// // Use the middleware
// app.use(setCorsHeaders);

// const logRequests = (req: Request, res: Response, next: NextFunction) => {
//   const { headers, method, url } = req;
//   const startTime = Date.now();

//   // Log request details when it starts
//   console.log(`[${new Date().toISOString()}] ${method} ${url} ${JSON.stringify(headers)}`);

//   console.log('CORS Options Credentials: ', corsOptions.credentials);
//   console.log('Response Headers Before Sending:', JSON.stringify(res.getHeaders()));

//   // Log response details when it finishes
//   res.on('finish', () => {
//     const duration = Date.now() - startTime;
//     console.log('Response Headers After Sending:', JSON.stringify(res.getHeaders()));
//     console.log(`[${new Date().toISOString()}] ${method} ${url} ${res.statusCode} - ${duration}ms`);
//   });

//   next();
// };

// // Use the middleware in your app
// app.use(logRequests);

app.use(json());
app.use(urlencoded({ extended: true }));

app.post('/api/auth/register', (req, res) => {
  res.json({ message: 'Registration successful' });
});

// app.get('/', (req: Request, res: Response) => {
//   res.status(200).send('Natalius API is active');
// });

// app.use('/api/auth', authRoutes);
// app.use('/api/tokens', tokenRoutes);

// app.use(verifyJWT);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/profiles', profileRoutes);
// app.use('/api/clubs', clubRoutes);
// app.use('/api/shifts', shiftRoutes);
// app.use('/api/income', incomeRoutes);
// app.use('/api/vendors', vendorRouters);
// app.use('/api/expenses', expenseRoutes);
// app.use('/api/sprints', sprintRoutes);
// app.use('/api/images', imageRoutes);

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
