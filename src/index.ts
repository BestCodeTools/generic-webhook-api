import express from 'express';
import mongoConnect, { ObjectId } from './db/mongo/connect';
import request from './utils/request';

const dbConnectionDefaultHandler = (response: express.Response) => (error: any) => {
  console.error('Error:', error);
  response.status(422).json({ message: 'Could not connect to database!' });
};


const app = express();
app.use(express.json());
app.use(express.text({ type: 'text/*' }));
app.use(express.urlencoded({ extended: true }));
// parse xml as string
app.use((req, _res, next) => {
  if (req.is('text/xml') || req.is('application/xml')) {
    let text = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      text += chunk;
    });
    req.on('end', () => {
      req.body = text;
      next();
    });
  }
  else {
    next();
  }
});

app.post('/api/v1/webhook/:service', (req, res) => {
  res.send('');
  process.nextTick(() => {
    
    mongoConnect().then(({ client, db }) => {
      db.collection('calls').insertOne({
        service: req.params.service,
        originalUrl: req.originalUrl,
        ip: req.ip,
        moreInfo: {
          protocol: req.protocol,
          hostname: req.hostname,
          path: req.path,
          method: req.method,
          baseUrl: req.baseUrl,
          subdomains: req.subdomains,
          xhr: req.xhr,
          fresh: req.fresh,
          stale: req.stale,
          secure: req.secure,
          ips: req.ips,
          route: req.route,
          socket: {
            localAddress: req.socket.localAddress,
            localPort: req.socket.localPort,
            remoteAddress: req.socket.remoteAddress,
            remoteFamily: req.socket.remoteFamily,
            remotePort: req.socket.remotePort,
          },
          version: req.httpVersion,
        },
        headers: req.headers,
        query: req.query,
        body: req.body,
        created_at: new Date()
      }).finally(() => client.close());
    });
  });
});

app.get('/api/v1/webhook/:service', (req, res) => {
  mongoConnect().then(({ client, db }) => {
    db.collection('calls').find({ service: req.params.service }).toArray().then((calls) => {
      res.json(calls);
    }).finally(() => client.close());
  })
    .catch(dbConnectionDefaultHandler(res));
});
app.get('/api/v1/webhook/:service/:id', (req, res) => {
  mongoConnect().then(({ client, db }) => {
    db.collection('calls').findOne({ service: req.params.service, _id: new ObjectId(req.params.id) }).then((call) => {
      res.json(call);
    }).finally(() => client.close());
  })
    .catch(dbConnectionDefaultHandler(res));
});
app.post('/api/v1/webhook/:service/:id/forward', (req, res) => {
  const { targetUrl, method, headers, } = req.body;
  if (!targetUrl) { 
    res.status(400).send({ message: 'Missing targetUrl in the request body!' });
    return;
  }
  if (!method) {
    res.status(400).send({ message: 'Missing method in the request body!' });
    return;
  }
  mongoConnect().then(({ client, db }) => {
    db.collection('calls').findOne({ service: req.params.service, _id: new ObjectId(req.params.id) }).then((call) => {
      if (call) {
        console.log('Forwarding call to:', targetUrl);
        // Forward the call here
        request(targetUrl, {
          method: method,
          headers: { ...call.headers, ...headers },
          body: call.body
        }).then((response) => {
          console.log('Response:', response.status, response.statusText);
          response.headers.forEach((value, name) => {
            res.setHeader(name, value);
          });
          res.status(response.status).send(response.body);
        }).catch((error) => {
          console.error('Error:', error);
          res.status(500).send({ message: 'Error forwarding the call!', error: error.message });
        
        });
      }
      else {
        console.log('Call not found!');
        res.status(404).send({ message: 'Webhook Call not found!' });
      }
    }).finally(() => client.close());
  })
    .catch(dbConnectionDefaultHandler(res));
});

console.log('App is starting...');
console.log(' > Connecting to MongoDB...')
mongoConnect().then(({ client }) => {
  client.close().then(() => {
    console.log(' > MongoDB connection was successful! Starting the app...');
    app.listen(3000, () => {
      console.log(' > Listening on port 3000!');
    });
  });
}).catch((error) => {
  console.error(' > MongoDB connection failed! Exiting...');
  console.error(error);
  process.exit(1);
});