import { describe, expect, it, vi } from 'vitest';
import { createMigrationHandler } from './index.mjs';

const fixtureSecret = JSON.stringify({
  username: 'safeflow_admin',
  password: 'secret-password',
  host: 'safeflow-private.example',
  port: 5432,
  dbname: 'safeflow'
});

const fixtureAppSecret = JSON.stringify({
  username: 'safeflow_api',
  password: 'api-secret-password',
  host: 'safeflow-private.example',
  port: 5432,
  dbname: 'safeflow'
});

function createClient() {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    end: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue({})
  };
}

describe('SafeFlow migration Lambda handler', () => {
  it('plans the approved simulation migration without reading database credentials', async () => {
    const readSecret = vi.fn();
    const clientFactory = vi.fn();
    const handler = createMigrationHandler({
      readSecret,
      clientFactory,
      env: {
        SAFEFLOW_ENVIRONMENT: 'simulation',
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database'
      }
    });

    const response = await handler({ action: 'plan-approved-simulation-migration' });
    const payload = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(payload).toMatchObject({
      product: 'SafeFlow',
      simulationOnly: true,
      mode: 'dry-run',
      action: 'planned'
    });
    expect(payload.migrations.map((migration) => migration.path)).toEqual([
      'database/schema.sql',
      'database/seed.sql'
    ]);
    expect(readSecret).not.toHaveBeenCalled();
    expect(clientFactory).not.toHaveBeenCalled();
  });

  it('refuses execution unless the invoke event carries explicit migration approval', async () => {
    const readSecret = vi.fn();
    const clientFactory = vi.fn();
    const handler = createMigrationHandler({
      readSecret,
      clientFactory,
      env: {
        SAFEFLOW_ENVIRONMENT: 'simulation',
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database'
      }
    });

    const response = await handler({ action: 'execute-approved-simulation-migration' });
    const payload = JSON.parse(response.body);

    expect(response.statusCode).toBe(400);
    expect(payload.error).toMatch(/approved=true/);
    expect(readSecret).not.toHaveBeenCalled();
    expect(clientFactory).not.toHaveBeenCalled();
  });

  it('executes the approved simulation migration with the generated database secret', async () => {
    const client = createClient();
    const readSecret = vi.fn(async (secretId) => (
      secretId.includes('database/api') ? fixtureAppSecret : fixtureSecret
    ));
    const clientFactory = vi.fn(() => client);
    const handler = createMigrationHandler({
      readSecret,
      clientFactory,
      env: {
        SAFEFLOW_ENVIRONMENT: 'simulation',
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database/admin',
        APP_DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database/api'
      }
    });

    const response = await handler({
      action: 'execute-approved-simulation-migration',
      approved: true
    });
    const payload = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(payload).toMatchObject({
      product: 'SafeFlow',
      simulationOnly: true,
      mode: 'execute',
      action: 'executed'
    });
    expect(readSecret).toHaveBeenCalledWith('arn:aws:secretsmanager:eu-west-2:123456789012:secret:database/admin');
    expect(readSecret).toHaveBeenCalledWith('arn:aws:secretsmanager:eu-west-2:123456789012:secret:database/api');
    expect(clientFactory).toHaveBeenCalledWith(expect.objectContaining({
      host: 'safeflow-private.example',
      database: 'safeflow',
      ssl: {
        rejectUnauthorized: true,
        ca: expect.stringContaining('BEGIN CERTIFICATE')
      }
    }));
    expect(client.query).toHaveBeenNthCalledWith(1, 'begin');
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('create role safeflow_api login'));
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("set_config('safeflow.api_password'"),
      ['api-secret-password']
    );
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('grant select on users, wards, patient_summaries'));
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('grant insert on audit_events'));
    expect(client.query).toHaveBeenLastCalledWith(expect.stringContaining('grant insert on audit_events'));
    expect(client.end).toHaveBeenCalled();
    expect(JSON.stringify(payload)).not.toContain('secret-password');
    expect(JSON.stringify(client.query.mock.calls.map(([sql]) => sql))).not.toContain('api-secret-password');
    expect(JSON.stringify(payload)).not.toContain('safeflow-private.example');
  });

  it('refuses to configure the application database role without the app database secret', async () => {
    const client = createClient();
    const handler = createMigrationHandler({
      readSecret: vi.fn().mockResolvedValue(fixtureSecret),
      clientFactory: vi.fn(() => client),
      env: {
        SAFEFLOW_ENVIRONMENT: 'simulation',
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database/admin'
      }
    });

    const response = await handler({
      action: 'execute-approved-simulation-migration',
      approved: true
    });
    const payload = JSON.parse(response.body);

    expect(response.statusCode).toBe(400);
    expect(payload.error).toMatch(/APP_DATABASE_SECRET_ARN/);
  });

  it('redacts database credentials from execution errors', async () => {
    const client = createClient();
    client.query
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('failed postgresql://safeflow_admin:secret-password@safeflow-private.example/safeflow'))
      .mockResolvedValueOnce({});
    const handler = createMigrationHandler({
      readSecret: vi.fn(async (secretId) => (
        secretId.includes('database/api') ? fixtureAppSecret : fixtureSecret
      )),
      clientFactory: vi.fn(() => client),
      env: {
        SAFEFLOW_ENVIRONMENT: 'simulation',
        SAFEFLOW_SIMULATION_ONLY: 'true',
        DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database/admin',
        APP_DATABASE_SECRET_ARN: 'arn:aws:secretsmanager:eu-west-2:123456789012:secret:database/api'
      }
    });

    const response = await handler({
      action: 'execute-approved-simulation-migration',
      approved: true
    });
    const payload = JSON.parse(response.body);

    expect(response.statusCode).toBe(500);
    expect(payload.error).toContain('postgresql://[redacted]@safeflow-private.example/safeflow');
    expect(payload.error).not.toContain('secret-password');
    expect(client.query).toHaveBeenLastCalledWith('rollback');
    expect(client.end).toHaveBeenCalled();
  });
});
