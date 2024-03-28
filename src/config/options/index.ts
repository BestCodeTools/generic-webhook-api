import { MongoClientOptions } from 'mongodb';

const $cfg = {
  mongo: {
    uri: `${process.env.MONGO_URI}`,
    db: `${process.env.MONGO_DB}`.replace('undefined', 'webhook'),
    options: {
    } as MongoClientOptions
  }
};

export default $cfg;