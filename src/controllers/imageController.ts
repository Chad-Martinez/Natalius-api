import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import Shift from '../models/Shift';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const addImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { file } = req;
    const { shiftId } = req.body;

    if (file! instanceof File || file === undefined) throw new HttpErrorResponse(400, 'No File Attached');

    const shift = await Shift.findById(shiftId);

    if (!shift) throw new HttpErrorResponse(404, 'Shift not found');

    const fileBuffer = file.buffer;

    cloudinary.uploader
      .upload_stream({ format: 'webp' }, async (error, result) => {
        if (error) {
          console.error('Error uploading to Cloudinary:', error);
          return res.status(500).json({ success: false, error });
        }
        if (result) {
          shift.image = result;
          await shift.save();
        }
        return res.status(201).json({ success: true });
      })
      .end(fileBuffer);

    res.status(200);
  } catch (error) {
    console.error('Image Controller - AddImage Error: ', error);
    next(error);
  }
};

export const deleteImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { shiftId } = req.body;
    const { public_id } = req.body;

    const shift = await Shift.findById(shiftId);
    if (!shift) throw new HttpErrorResponse(404, 'Shift not found');

    const result = await cloudinary.uploader.destroy(public_id);

    shift.image = undefined;
    await shift.save();
    res.status(200).json({ message: 'Image deleted' });
  } catch (error) {
    console.error('Image Controller - DeleteImage Error: ', error);
    next(error);
  }
};
