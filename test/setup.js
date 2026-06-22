/**
 * Backend test setup — Sprint 9F
 *
 * Stack: Jest + Supertest + mongodb-memory-server
 *
 * Install:
 *   npm install -D jest supertest mongodb-memory-server @types/jest
 *
 * package.json scripts:
 *   "test": "jest --runInBand",
 *   "test:watch": "jest --watch"
 *
 * jest.config.js:
 *   module.exports = {
 *     testEnvironment: 'node',
 *     setupFilesAfterFramework: ['./test/setup.js'],
 *     testMatch: ['test files under __tests__ ending in .test.js'],
 *   };
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
