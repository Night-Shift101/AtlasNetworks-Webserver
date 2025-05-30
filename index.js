require('dotenv').config();
const fs      = require('fs');
const path    = require('path');
const express = require('express');
const vhost   = require('vhost');
const morgan  = require('morgan');


const { app: staffApp }  = require('./staff/app');
const { app: rootApp  }   = require('./root/app');
const { app: banApp }     = require('./bans/app');
const { app: appealApp }  = require("./appeals/app");

const server = express();

morgan.token('user', (req) => {
  return req.user
    ? `${req.user.username}`
    : '–';      // or 'guest'
});
morgan.token('host', req => req.headers.host);
const fmt = '[:date[iso]] :remote-addr \n:user \n:method :host:url \n:status :response-time ms\n';


// ─── prepare logs directory & file ────────────────────────────────────────
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// timestamped filename: e.g. “2025-05-17T23-45-12.log”
const now      = new Date();
const ts       = now.toISOString().replace(/:/g, '-').split('.')[0];
const logPath  = path.join(logsDir, `${ts}.log`);
const logStream = fs.createWriteStream(logPath, { flags: 'a' });

// ─── hijack console.log / console.error ──────────────────────────────────
const origLog  = console.log;
const origErr  = console.error;

console.log = (...args) => {
  const line = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  logStream.write(`[LOG - ${new Date().toISOString()}] ${line}\n`);
  origLog.apply(console, args);
};

console.error = (...args) => {
  const line = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  logStream.write(`[ERR - ${new Date().toISOString()}] ${line}\n`);
  origErr.apply(console, args);
};
server.use(morgan(fmt, { stream: logStream }));
server.use(
  vhost('staff.atlasnetworksroleplay.com', staffApp),
  vhost('www.staff.atlasnetworksroleplay.com', staffApp)
);
server.use(
  vhost('bans.atlasnetworksroleplay.com', banApp),
  vhost('www.bans.atlasnetworksroleplay.com', banApp)
);
server.use(
  vhost('atlasnetworksroleplay.com', rootApp),
  vhost('www.atlasnetworksroleplay.com', rootApp)
);
server.use(
  vhost('appeals.atlasnetworksroleplay.com', appealApp),
  vhost('www.appeals.atlasnetworksroleplay.com', appealApp)
);

// Catch-all for unknown hosts
server.use((req, res) => {
  res.status(404).send('Unknown host');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(
    `Listening on port ${PORT} for staff.${process.env.DOMAIN}, bans.${process.env.DOMAIN}, ${process.env.DOMAIN}…`
  );
});
