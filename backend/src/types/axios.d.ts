declare module 'axios' {
  export interface AxiosInstance {
    (config?: any): any;
    get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>>;
    post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>>;
    put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>>;
    delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>>;
  }

  export interface AxiosResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: any;
  }
}

declare module 'react-dom' {
  interface FormEvent extends Event {
    target: HTMLInputElement & {
      files?: FileList;
    };
  }
}

declare module 'react-router-dom' {
  export interface NavigateFunction {
    (to: string, options?: any): void;
  }
}