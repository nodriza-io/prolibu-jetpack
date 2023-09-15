const signIn = require('../../lib/signin');
const superagent = require('superagent');
const fs = require('fs');
const prompt = require('prompt');

// Mocking the required modules
jest.mock('superagent');
jest.mock('fs');
jest.mock('prompt');

describe('signIn', () => {
  beforeEach(() => {
    // Mocking prompt methods
    prompt.start = jest.fn();

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should sign in successfully', async () => {
    // Mock user inputs
    prompt.get
      .mockImplementationOnce((options, callback) => callback(null, { domain: 'dev4' }))
      .mockImplementationOnce((options, callback) => callback(null, { email: 'user@example.com' }))
      .mockImplementationOnce((options, callback) => callback(null, { password: 'password123' }));

    // Mock superagent responses
    superagent.post.mockResolvedValueOnce({
      body: { apiKey: 'test_api_key' },
    });
    superagent.get.mockResolvedValueOnce({
      body: {
        profile: { firstName: 'John', lastName: 'Doe' },
      },
    });

    // Run the function
    await signIn();

    // Check if the success message was displayed
    const consoleLog = console.log.mock.calls[0][0];
    expect(consoleLog).toContain('Sign in successful, welcome John Doe');

    // Check if the profile.json file was written (you can extend this with mock-fs)
    // ...
  });

  it('should handle failed sign in due to invalid credentials', async () => {
    // Mock user inputs
    prompt.get
      .mockImplementationOnce((options, callback) => callback(null, { domain: 'dev4' }))
      .mockImplementationOnce((options, callback) => callback(null, { email: 'user@example.com' }))
      .mockImplementationOnce((options, callback) => callback(null, { password: 'wrongpassword' }));

    superagent.post.mockRejectedValueOnce({
      response: {
        body: 'Invalid credentials',
      },
    });

    await signIn();

    const consoleError = console.error.mock.calls[0][0];
    expect(consoleError).toContain('Error signing in: Invalid credentials');
  });

  it('should handle network or other errors during sign in', async () => {
    // Mock user inputs
    prompt.get
      .mockImplementationOnce((options, callback) => callback(null, { domain: 'dev4' }))
      .mockImplementationOnce((options, callback) => callback(null, { email: 'user@example.com' }))
      .mockImplementationOnce((options, callback) => callback(null, { password: 'password123' }));

    superagent.post.mockRejectedValueOnce(new Error('Network error'));

    await signIn();

    const consoleError = console.error.mock.calls[0][0];
    expect(consoleError).toContain('Error signing in: Network error');
  });
});
