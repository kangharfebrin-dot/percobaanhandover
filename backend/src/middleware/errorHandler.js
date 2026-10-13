const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Ukuran file melebihi batas maksimal (10MB).';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Jumlah file melebihi batas yang diizinkan.';
    } else {
      message = `Gagal mengunggah file: ${err.message}`;
    }
  }

  // Custom response structure
  const response = {
    error: message
  };

  // Stack trace hanya ditampilkan saat tidak di production
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;

