import { NextFunction, Response, RequestHandler } from 'express';
import { ICustomRequest } from './interfaces/CustomeRequest.interface';
import Expense from './models/Expense';

// router.post('/bulk', addBulkExpenses);

export const addBulkExpenses: RequestHandler = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // const { userId } = req;

    const result = await Expense.insertMany(req.body);
    console.log(result);
    res.status(200).json({ message: 'Ok!' });
  } catch (error) {
    console.error('controller ', error);
    next(error);
  }
};
