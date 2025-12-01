declare module 'express' {
  interface Request {
    upload?: any;
  }
}

declare module 'multer' {
  interface Multer {
    (options?: any): any;
  }
}

declare module 'morgan' {
  function (format?: string): any;
}

declare module 'cors' {
  function (options?: any): any;
}

declare module 'helmet' {
  function (options?: any): any;
}

declare module 'express-rate-limit' {
  function (options?: any): any;
}

declare module 'express-validator' {
  function body(field: string): any;
  function validationResult(req: any): any;
}

declare module 'dotenv' {
  function config(): any;
}

declare module 'jsonwebtoken' {
  function sign(payload: any, secret: string, options?: any): string;
  function verify(token: string, secret: string): any;
}

declare module 'bcryptjs' {
  function hash(password: string, saltRounds?: number): Promise<string>;
  function compare(password: string, hash: string): Promise<boolean>;
}