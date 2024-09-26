class ApiResponse {
  constructor(
    statusCode,
    data,
    message = statusCode < 400 ? "Success" : "Error"
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
