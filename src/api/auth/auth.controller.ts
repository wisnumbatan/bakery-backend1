import { Request, Response } from 'express';
import { AuthService, authService } from './auth.service';
import { asyncHandler } from '../../utils/helpers';
import { ILoginRequest, IRegisterRequest } from '../../types/auth.types';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = asyncHandler(async (req: Request, res: Response) => {
    const userData: IRegisterRequest = req.body;
    const result = await this.authService.register(userData);

    res.status(201).json({
      success: true,
      data: result
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const credentials: ILoginRequest = req.body;
    const result = await this.authService.login(credentials);

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken
      }
    });
  });

  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    await this.authService.verifyEmail(req.params.token);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.refreshToken(req.cookies.refreshToken);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  logout = asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie('refreshToken');
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password } = req.body;

    await this.authService.resetPassword(token, password);

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    await this.authService.forgotPassword(email);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  });
}

export const authController = new AuthController(authService);