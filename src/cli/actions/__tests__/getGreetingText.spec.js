import getGreetingText from '../getGreetingText';

jest.mock('messaging-api-messenger');

jest.mock('../../shared/log');
jest.mock('../../shared/getConfig');

const { MessengerClient } = require('messaging-api-messenger');

const log = require('../../shared/log');
const getConfig = require('../../shared/getConfig');

const MOCK_FILE_WITH_PLATFORM = {
  messenger: {
    accessToken: '__FAKE_TOKEN__',
  },
  LINE: {},
};
const configPath = 'bot.sample.json';

let _client;

beforeEach(() => {
  _client = {
    getGreetingText: jest.fn(),
  };
  MessengerClient.factory = jest.fn(() => _client);
  log.error = jest.fn();
  log.print = jest.fn();
  getConfig.mockReturnValue(MOCK_FILE_WITH_PLATFORM.messenger);
});

it('be defined', () => {
  expect(getGreetingText).toBeDefined();
});

describe('resolved', () => {
  it('call getGreetingText', async () => {
    _client.getGreetingText.mockReturnValue(
      Promise.resolve({
        data: {
          data: [
            {
              greeting: [{ text: 'hello' }],
            },
          ],
        },
      })
    );

    await getGreetingText(configPath);

    expect(log.print).toHaveBeenCalledTimes(1);
    expect(_client.getGreetingText).toBeCalled();
  });

  it('error when no config setting', async () => {
    _client.getGreetingText.mockReturnValue(
      Promise.resolve({
        data: {
          data: [],
        },
      })
    );

    await getGreetingText(configPath);

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(_client.getGreetingText).toBeCalled();
  });
});

describe('reject', () => {
  it('handle error thrown with only status', async () => {
    const error = {
      response: {
        status: 400,
      },
    };
    _client.getGreetingText.mockReturnValue(Promise.reject(error));

    process.exit = jest.fn();

    await getGreetingText(configPath);

    expect(log.error).toHaveBeenCalledTimes(2);
    expect(process.exit).toBeCalled();
  });

  it('handle error thrown by messenger', async () => {
    const error = {
      response: {
        status: 400,
        data: {
          error: {
            message: '(#100) ...',
            type: 'OAuthException',
            code: 100,
            error_subcode: 2018145,
            fbtrace_id: 'HXd3kIOXLsK',
          },
        },
      },
    };
    _client.getGreetingText.mockReturnValue(Promise.reject(error));

    process.exit = jest.fn();

    await getGreetingText(configPath);

    expect(log.error).toHaveBeenCalledTimes(3);
    expect(log.error.mock.calls[2][0]).not.toMatch(/\[object Object\]/);
    expect(process.exit).toBeCalled();
  });

  it('handle error thrown by ourselves', async () => {
    const error = {
      message: 'something wrong happened',
    };
    _client.getGreetingText.mockReturnValue(Promise.reject(error));

    process.exit = jest.fn();

    await getGreetingText(configPath);

    expect(log.error).toHaveBeenCalledTimes(2);
    expect(process.exit).toBeCalled();
  });
});
