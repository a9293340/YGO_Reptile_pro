import request from 'request-promise';

export const reptileByForm = async (url, form) =>
  request({
    url,
    method: 'POST',
    form,
    encoding: null,
  });
