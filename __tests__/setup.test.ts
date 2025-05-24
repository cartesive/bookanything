// Basic setup test to verify Jest configuration
describe('Test Setup', () => {
  it('should have Jest configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should have fetch mocked globally', () => {
    expect(global.fetch).toBeDefined();
    expect(jest.isMockFunction(global.fetch)).toBe(true);
  });
});