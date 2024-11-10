export interface IAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest extends ILoginRequest {
  name: string;
  phoneNumber?: string;
  address?: IAddress;
}

export interface IAuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface IPasswordReset {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface IJwtPayload {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}