import { CorsOptions } from 'cors';
import { allowedOrigins } from './allowedOrigins';
import HttpErrorResponse from '../classes/HttpErrorResponse';

export const corsOptions: CorsOptions = {
  origin: (origin = '', callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new HttpErrorResponse(400, 'Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET, POST, PUT, PATCH, DELETE, OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  optionsSuccessStatus: 200,
};
