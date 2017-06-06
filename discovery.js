const RateLimiter = require('request-rate-limiter');

const limiter = new RateLimiter({ rate: 20, interval: 1, backoffCode: 429, backoffTime: 1 });

const flatten = list => list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);

const mergePages = (method, allResultsArray) => {
  const domain = method.split('.')[0];
  const action = method.split('.')[1];
  const firstPage = allResultsArray[0];

  if (domain === 'enterprise') {
    const merged = allResultsArray.map(r => r.enterprise.teams);
    firstPage.enterprise.teams = flatten(merged);
  } else if (action === 'history') {
    const merged = allResultsArray.map(r => r.messages);
    firstPage.messages = flatten(merged);
  } else {
    firstPage[domain] = flatten(allResultsArray.map(r => r[domain]));
  }

  return firstPage;
};

const apiCall = (method, params) => {
  const token = { token: process.env.TOKEN, limit: 20 };
  return limiter.request({
    url: `https://slack.com/api/discovery.${method}`,
    method: 'post',
    form: Object.assign(token, params),
  });
};

const fetch = (method, params) =>
  new Promise((resolve, reject) => {
    const allResults = [];

    const fetchPage = (nparams) => {
      apiCall(method, nparams).then((result) => {
        const body = JSON.parse(result.body);
        allResults.push(body);

        if (body.offset) {
          const offsetParams = Object.assign({}, params, { offset: body.offset });
          fetchPage(offsetParams);
        } else {
          resolve(mergePages(method, allResults));
        }
      }).catch(err => reject(err));
    };

    fetchPage(params);
  });

module.exports = { fetch };
