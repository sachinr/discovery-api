require('dotenv').config();
const discoveryAPI = require('./discovery');

const getListAndHistory = (methods, team) => {
  const params = team ? { team: team.id } : {};

  methods.forEach((method) => {
    discoveryAPI.fetch(`${method}.list`, params).then((listResult) => {
      listResult[method].forEach((channel) => {
        params.channel = channel.id;
        discoveryAPI.fetch(`${method}.history`, params).then((historyResult) => {
          console.log(historyResult);
        });
      });
    });
  });
};

const init = () => {
  discoveryAPI.fetch('enterprise.info').then((infoResult) => {
    infoResult.enterprise.teams.forEach((team) => {
      getListAndHistory(['channels', 'groups'], team);
    });
  });

  getListAndHistory(['channels', 'groups', 'dms']);
};

init();
