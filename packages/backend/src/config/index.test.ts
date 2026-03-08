import { config } from './index';

describe('Configuration', () => {
  it('should load configuration values', () => {
    expect(config).toBeDefined();
    expect(config.port).toBeDefined();
    expect(config.database).toBeDefined();
    expect(config.redis).toBeDefined();
    expect(config.jwt).toBeDefined();
  });

  it('should have default port value', () => {
    expect(config.port).toBeGreaterThan(0);
  });

  it('should have database configuration', () => {
    expect(config.database.host).toBeDefined();
    expect(config.database.port).toBeGreaterThan(0);
    expect(config.database.name).toBeDefined();
  });

  it('should have redis configuration', () => {
    expect(config.redis.host).toBeDefined();
    expect(config.redis.port).toBeGreaterThan(0);
  });

  it('should have jwt configuration', () => {
    expect(config.jwt.secret).toBeDefined();
    expect(config.jwt.expiresIn).toBeDefined();
  });
});
