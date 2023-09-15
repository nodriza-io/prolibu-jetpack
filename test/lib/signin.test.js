const axios = require('axios');
const inquirer = require('inquirer');
const fs = require('fs');
const signIn = require('../lib/signin');

jest.mock('axios');
jest.mock('inquirer');

describe('signIn', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should sign in successfully', async () => {
    // Mock user inputs
    inquirer.prompt.mockResolvedValueOnce({ domain: 'dev4' })
      .mockResolvedValueOnce({ email: 'user@example.com' })
      .mockResolvedValueOnce({ password: 'password123' });

    // Mock axios responses
    axios.post.mockResolvedValue({
      data: { apiKey: 'test_api_key' },
    });
    axios.get.mockResolvedValue({
      data: {
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
    inquirer.prompt.mockResolvedValueOnce({ domain: 'dev4' })
      .mockResolvedValueOnce({ email: 'user@example.com' })
      .mockResolvedValueOnce({ password: 'wrongpassword' });

    axios.post.mockRejectedValue({
      response: {
        data: 'Invalid credentials',
      },
    });

    await signIn();

    const consoleError = console.error.mock.calls[0][0];
    expect(consoleError).toContain('Error signing in: Invalid credentials');
  });

  it('should handle network or other errors during sign in', async () => {
    inquirer.prompt.mockResolvedValueOnce({ domain: 'dev4' })
      .mockResolvedValueOnce({ email: 'user@example.com' })
      .mockResolvedValueOnce({ password: 'password123' });

    axios.post.mockRejectedValue(new Error('Network error'));

    await signIn();

    const consoleError = console.error.mock.calls[0][0];
    expect(consoleError).toContain('Error signing in: Network error');
  });
});
