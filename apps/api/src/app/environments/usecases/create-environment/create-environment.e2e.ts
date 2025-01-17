import { EnvironmentRepository, LayoutRepository } from '@novu/dal';
import { UserSession } from '@novu/testing';
import { expect } from 'chai';

describe('Create Environment - /environments (POST)', async () => {
  let session: UserSession;
  const environmentRepository = new EnvironmentRepository();
  const layoutRepository = new LayoutRepository();
  before(async () => {
    session = new UserSession();
    await session.initialize({
      noEnvironment: true,
    });
  });

  it('should create environment entity correctly', async () => {
    const demoEnvironment = {
      name: 'Hello App',
    };
    const { body } = await session.testAgent.post('/v1/environments').send(demoEnvironment).expect(201);

    expect(body.data.name).to.eq(demoEnvironment.name);
    expect(body.data._organizationId).to.eq(session.organization._id);
    expect(body.data.identifier).to.be.ok;
    const dbApp = await environmentRepository.findOne({ _id: body.data._id });

    expect(dbApp.apiKeys.length).to.equal(1);
    expect(dbApp.apiKeys[0].key).to.be.ok;
    expect(dbApp.apiKeys[0]._userId).to.equal(session.user._id);
  });

  it('should fail when no name provided', async () => {
    const demoEnvironment = {};
    const { body } = await session.testAgent.post('/v1/environments').send(demoEnvironment).expect(400);

    expect(body.message[0]).to.contain('name should not be null');
  });

  it('should create a default layout for environment', async function () {
    const demoEnvironment = {
      name: 'Hello App',
    };
    const { body } = await session.testAgent.post('/v1/environments').send(demoEnvironment).expect(201);
    session.environment = body.data;

    await session.fetchJWT();
    const { body: layouts } = await session.testAgent.get('/v1/layouts');

    expect(layouts.data.length).to.equal(1);
    expect(layouts.data[0].isDefault).to.equal(true);
    expect(layouts.data[0].content.length).to.be.greaterThan(20);
  });
});
