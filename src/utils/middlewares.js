const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');

const setupMiddlewares = (app) => {
  app.use(helmet());
  app.use(xss());
  app.use(
    hpp({
      whitelist: ['code', 'type', 'debit', 'credit'],
    }),
  );

  app.use(express.json({ limit: '10kb' }));
  app.use(morgan('dev'));

  const limiter = rateLimit({
    max: 1000,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!',
  });

  app.use('/api', limiter);

  app.use((req, res, next) => {
    req.requestDate = new Date().toISOString();
    next();
  });

  app.use((req, res, next) => {
    console.log(`This request had been made at ${req.requestDate}`);
    next();
  });

  app.use(express.static(`${__dirname}/../public/`));
};

module.exports = setupMiddlewares;
