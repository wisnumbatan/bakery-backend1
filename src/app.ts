import express from 'express';
import { Express, Request, Response, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { config } from 'dotenv';
import { join } from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

import { connectDatabase } from './config/database';
import { configureMiddleware } from './config/middleware';
import logger from './config/logger';
import { generateJwtSecrets } from './utils/jwt.utils';
import authRoutes from './api/auth/auth.routes';
import productRoutes from './api/products/product.routes';
import orderRoutes from './api/orders/order.routes';
import userRoutes from './api/users/user.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Load env vars and generate JWT secrets if needed
config();

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  generateJwtSecrets();
}

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bakery API Documentation',
      version: '1.0.0',
      description: 'API Documentation for Bakery Management System'
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/api/**/*.ts']
};

class App {
  public app: Application;
  private readonly port: number;

  constructor() {
    this.app = express();
    this.port = Number(process.env.PORT) || 5000;
    this.initializeMiddlewares();
    this.initializeSwagger();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Basic middleware
    this.app.use(express.json({ limit: '10kb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10kb' }));
    
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production'
    }));
    
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Data sanitization
    this.app.use(mongoSanitize());
    this.app.use(hpp());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: process.env.NODE_ENV === 'production' ? 100 : 1000,
      message: 'Too many requests from this IP, please try again later'
    });

    this.app.use('/api', limiter);

    // Compression and logging
    this.app.use(compression());
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined', {
        stream: { write: message => logger.info(message.trim()) }
      }));
    }

    // Static files
    this.app.use('/uploads', express.static(join(__dirname, '../uploads')));

    // Additional middleware
    configureMiddleware(this.app);
  }

  private initializeSwagger(): void {
    const specs = swaggerJsDoc(swaggerOptions);
    this.app.use('/api/v1/docs', 
      swaggerUi.serve, 
      swaggerUi.setup(specs, {
        explorer: true,
        customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-themes@3.0.0/themes/3.x/theme-material.css'
      })
    );
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });
    });

    // API routes
    const apiRouter = express.Router();
    apiRouter.use('/auth', authRoutes);
    apiRouter.use('/products', productRoutes);
    apiRouter.use('/orders', orderRoutes);
    apiRouter.use('/users', userRoutes);

    this.app.use('/api/v1', apiRouter);

    // Handle 404
    this.app.use(notFoundHandler);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();

      const server = this.app.listen(this.port, () => {
        logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${this.port}`);
        logger.info(`📚 API Documentation: http://localhost:${this.port}/api/v1/docs`);
      });

      // Graceful shutdown
      const shutdown = async () => {
        logger.info('Shutting down server...');
        
        server.close(() => {
          logger.info('Server closed');
          process.exit(0);
        });

        // Force close after 10s
        setTimeout(() => {
          logger.error('Could not close connections in time, forcefully shutting down');
          process.exit(1);
        }, 10000);
      };

      // Handle shutdown signals
      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);

      // Handle uncaught exceptions
      process.on('uncaughtException', (error: Error) => {
        logger.error('Uncaught Exception:', error);
        shutdown();
      });

      // Handle unhandled promise rejections
      process.on('unhandledRejection', (reason: any) => {
        logger.error('Unhandled Rejection:', reason);
        shutdown();
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start server if file is run directly
if (require.main === module) {
  const app = new App();
  app.start().catch(error => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}

export default App;