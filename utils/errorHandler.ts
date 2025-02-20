import { Alert } from 'react-native';

type ErrorConfig = {
  silent?: boolean;
  retry?: () => Promise<any>;
};

class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: any, config: ErrorConfig = {}) {
    // Log error in development
    if (__DEV__) {
      console.error('Error:', error);
    }

    // Show error to user
    if (!config.silent) {
      this.showErrorAlert(error, config.retry);
    }

    // Return formatted error
    return this.formatError(error);
  }

  private showErrorAlert(error: any, retry?: () => Promise<any>) {
    const message = this.getErrorMessage(error);
    
    Alert.alert(
      'Error',
      message,
      retry
        ? [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Retry', 
              onPress: () => {
                retry().catch(e => this.handleError(e));
              }
            },
          ]
        : [{ text: 'OK' }]
    );
  }

  private getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error?.message) return error.message;
    return 'An unexpected error occurred';
  }

  private formatError(error: any) {
    return {
      message: this.getErrorMessage(error),
      code: error?.code || 'UNKNOWN_ERROR',
      original: error,
    };
  }
}

export const errorHandler = ErrorHandler.getInstance(); 