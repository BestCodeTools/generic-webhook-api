export {ObjectId} from 'mongodb';
import * as mongo from 'mongodb';
import $cfg from '../../config/options';

const mongoConnect = async () => {
  const client = await mongo.MongoClient.connect($cfg.mongo.uri, $cfg.mongo.options);
  const db = await client.db($cfg.mongo.db);

  return { client, db };
};

export default mongoConnect;