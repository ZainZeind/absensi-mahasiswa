import { Response } from 'express';

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const successResponse = (
  res: Response,
  message: string,
  data?: any,
  statusCode: number = 200,
  pagination?: any
): Response => {
  const response: ApiResponse = {
    success: true,
    message,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  message: string,
  error?: any,
  statusCode: number = 400
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error,
  };

  return res.status(statusCode).json(response);
};

export const notFoundResponse = (res: Response, message: string = 'Resource not found'): Response => {
  return errorResponse(res, message, null, 404);
};

export const unauthorizedResponse = (res: Response, message: string = 'Unauthorized'): Response => {
  return errorResponse(res, message, null, 401);
};

export const forbiddenResponse = (res: Response, message: string = 'Forbidden'): Response => {
  return errorResponse(res, message, null, 403);
};

export const serverErrorResponse = (res: Response, error?: any): Response => {
  console.error('Server Error:', error);
  return errorResponse(res, 'Internal server error', process.env.NODE_ENV === 'development' ? error : undefined, 500);
};