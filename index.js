const RateLimiter = require('request-rate-limiter');

const limiter = new RateLimiter({ rate: 20, interval: 1, backoffCode: 429, backoffTime: 1 });

const apiCall = (method, params) =>
  new Promise((resolve, reject) => {
    const token = { token: process.env.TOKEN };
    const req = limiter.request({
      url: `https://slack.com/api/discovery.${method}`,
      method: 'post',
      form: Object.assign({}, token, params),
    });

    req.then((result) => {
      resolve(JSON.parse(result.body));
    }).catch(err => reject(err));
  });

const init = () => {
  apiCall('enterprise.info').then((infoResult) => {
    infoResult.teams.forEach((team) => {
      ['channels', 'groups'].forEach((method) => {
        apiCall(`${method}.list`, { team: team.id }).then((listResult) => {
          listResult.channels.forEach((channel) => {
            apiCall(`${method}.history`, { team: team.id, channel: channel.id });
          });
        });
      });
    });

    ['channels', 'groups', 'dms'].forEach((method) => {
      apiCall(`${method}.list`).then((listResult) => {
        listResult.channels.forEach((channel) => {
          apiCall(`${method}.history`, { channel: channel.id });
        });
      });
    });
  });
};

init();
