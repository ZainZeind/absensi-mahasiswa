declare module 'sequelize' {
  interface Model {
    sequelize: any;
  }
}

declare module '@sequelize/core' {
  const DataTypes: any;
  const Op: any;
  const fn: any;
  const col: any;
  const literal: any;
}

declare module 'mysql2' {
  function authenticate(options: any): Promise<any>;
}

declare module 'jsonwebtoken' {
  interface JwtPayload {
    id: number;
    username: string;
    email: string;
    role: string;
    profileId?: number;
    profileType?: string;
  }

  function sign(payload: JwtPayload, secret: string, options?: any): string;
  function verify(token: string, secret: string): JwtPayload;
}

declare module 'date-fns' {
  function format(date: Date, formatStr: string, options?: any): string;
  function parse(dateStr: string, formatStr: string): Date;
}