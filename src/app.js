const AppError = require('./utils/appError');
const setupMiddlewares = require('./utils/middlewares.js');

require('dotenv').config();
const express = require('express');

const APIVersion = process.env.API_VERSION || 1;
const app = express();

setupMiddlewares(app);

const PORT = process.env.PORT || 3000;

// const accountsRouter = require('./routes/accounts');
// const balanceSheetRouter = require('./routes/balanceSheet');
// const transactionsRouter = require('./routes/transactions');
// const trialBalanceRouter = require('./routes/trialBalance');
//
// app.use(`/api/v/${APIVersion}/accounts`, accountsRouter);
// app.use(`/api/v/${APIVersion}/balance-sheet`, balanceSheetRouter);
// app.use(`/api/v/${APIVersion}/transactions`, transactionsRouter);
// app.use(`/api/v/${APIVersion}/trial-balance`, trialBalanceRouter);
//
// app.all('*', (req, res, next) => {
//   return next(
//     new AppError(`can't find ${req.originalUrl} on this server!`, 404),
//   );
// });

module.exports = app;
