import { Response, NextFunction } from 'express';
import { ICustomRequest } from '../interfaces/CustomeRequest.interface';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import { getUpcomingShiftWidgetData } from './shiftController';
import { getYtdIncomeWidgetData } from './incomeController';
import { getYtdExpenseWidgetData } from './expenseController';
import { getSprintWidgetData } from './sprintController';

export const getDashboardData = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;
    if (!userId) throw new HttpErrorResponse(404, 'Requested resource not found');

    const upcomingShifts = await getUpcomingShiftWidgetData(userId);
    const ytdIncome = await getYtdIncomeWidgetData(userId);
    const ytdExpenses = await getYtdExpenseWidgetData(userId);
    const sprint = await getSprintWidgetData(userId);

    res.status(200).json({ sprint, upcomingShifts, ytdIncome, ytdExpenses });
  } catch (error) {
    console.error('Dashboard Controller Error: ', error);
    next(error);
  }
};
