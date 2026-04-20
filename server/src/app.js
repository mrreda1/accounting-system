const AppError = require('./utils/appError');
const setupMiddlewares = require('./utils/middlewares.js');
const db = require('./config/db');

require('dotenv').config();
const express = require('express');

const APIVersion = process.env.API_VERSION || 1;
const app = express();

setupMiddlewares(app);

const PORT = process.env.PORT || 3000;

const accountsRouter = require('./routes/accounts');
const balanceSheetRouter = require('./routes/balanceSheet');
const incomeStatementRouter = require('./routes/incomeStatement');
const trialBalanceRouter = require('./routes/trialBalance');
const transactionsRouter = require('./routes/transactions');

app.use(`/api/v${APIVersion}/accounts`, accountsRouter);
app.use(`/api/v${APIVersion}/balance-sheet`, balanceSheetRouter);
app.use(`/api/v${APIVersion}/income-statement`, incomeStatementRouter);
app.use(`/api/v${APIVersion}/trial-balance`, trialBalanceRouter);
app.use(`/api/v${APIVersion}/transactions`, transactionsRouter);

const startServer = async () => {
	try {
		await db.initializeDatabase();
		app.listen(PORT, () => {
			console.log(`App running on port ${PORT}...`);
		});
	} catch (err) {
		console.error('Failed to connect to PostgreSQL:', err.message);
		process.exit(1);
	}
};

startServer();

module.exports = app;
