import cors from 'cors';
import http from 'http';
import helmet from 'helmet';
import express, { Request, Response } from 'express';
import multer from 'multer';
import * as api from './start';
import listenForTelemetryAlerts from './database/notify';
import { pgPool } from './database/pg';

/*
  Run the server.
*/
const upload = multer({ dest: 'whis-api/build/uploads' });

// only these urls can pass through unauthorized
const unauthorizedURLs: Record<string, string> = {
  status: '/get-onboard-status',
  submit: '/submit-onboarding-request'
};

const app = express()
  .use(helmet())
  .use(cors())
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .all('*', async (req: Request, res: Response, next) => {
    // determine if user is authorized    
      next(); // pass through    
  })
  // map
  // Health check
  .get('/health', (_, res) => res.send('healthy'))
  .get('*', api.notFound);

http.createServer(app).listen(3000, () => {
  console.log(`listening on port 3000`);
  pgPool.connect((err, client) => {
    const server = `${process.env.POSTGRES_SERVER_HOST ?? 'localhost'}:${
      process.env.POSTGRES_SERVER_PORT ?? 5432
    }`;
    if (err) {
      console.log(
        `error connecting to postgresql server host at ${server}: ${err}`
      );
    } else console.log(`postgres server successfully connected at ${server}`);
    client?.release();
  });
  const disableAlerts = process.env.DISABLE_TELEMETRY_ALERTS;
  if (!(disableAlerts === 'true')) {
    listenForTelemetryAlerts();
  }
});
