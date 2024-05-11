import express, { Request, Express, Response } from 'express';
import authRoutes from './routes/authRoutes';

const app: Express = express();
const port = process.env.PORT || 5050;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => res.send('Ooooh Yea!'));

app.use('/api/auth', authRoutes);

app.listen(port, () => console.log(`Server running oooh so smoothly at http://localhost:${port}`));
