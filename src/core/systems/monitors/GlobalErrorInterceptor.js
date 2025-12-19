export class GlobalErrorInterceptor {
  constructor(monitor) {
    this.monitor = monitor
  }

  setup() {
    if (this.monitor.isClient && typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.monitor.captureError('window.error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        }, event.error?.stack)
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.monitor.captureError('unhandled.promise.rejection', {
          reason: event.reason,
          promise: event.promise
        }, event.reason?.stack)
      })
    }

    if (this.monitor.isServer && typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        this.monitor.captureError('uncaught.exception', {
          message: error.message,
          name: error.name
        }, error.stack)
      })

      process.on('unhandledRejection', (reason, promise) => {
        this.monitor.captureError('unhandled.promise.rejection', {
          reason: reason,
          promise: promise
        }, reason?.stack)
      })
    }
  }
}
