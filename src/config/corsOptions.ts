import { CorsOptions } from 'cors';
import { allowedOrigins } from './allowedOrigins';
import HttpErrorResponse from '../classes/HttpErrorResponse';

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new HttpErrorResponse(400, 'Not allowed by CORS'));
    }
  },
  // credentials: true,
  // methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // allowedHeaders: [
  //   'Authorization',
  //   'Content-Type',
  //   'Origin',
  //   'Accept',
  //   'X-Requested-With',
  //   'Access-Control-Request-Method',
  //   'Access-Control-Request-Headers',
  //   'Access-Control-Allow-Origin',
  // ],
  // optionsSuccessStatus: 200,
  // exposedHeaders: ['Set-Cookie'],
};

// import { CorsOptions } from 'cors';
// import { allowedOrigins } from './allowedOrigins';
// import HttpErrorResponse from '../classes/HttpErrorResponse';

// export const corsOptions: CorsOptions = {
//   origin: (origin = '', callback) => {
//     if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
//       // Return the actual origin instead of true
//       callback(null, origin);
//     } else {
//       callback(new HttpErrorResponse(400, 'Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Fix: separate methods
//   allowedHeaders: ['Authorization', 'Content-Type'],
//   optionsSuccessStatus: 200,
// };

// import { CorsOptions } from 'cors';
// import { allowedOrigins } from './allowedOrigins';
// import HttpErrorResponse from '../classes/HttpErrorResponse';

// export const corsOptions: CorsOptions = {
//   origin: (origin = '', callback) => {
//     if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
//       callback(null, true);
//     } else {
//       callback(new HttpErrorResponse(400, 'Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ['GET, POST, PUT, PATCH, DELETE, OPTIONS'],
//   allowedHeaders: ['Authorization', 'Content-Type'],
//   optionsSuccessStatus: 200,
// };
