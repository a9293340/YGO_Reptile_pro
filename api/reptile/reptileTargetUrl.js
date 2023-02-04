import request from 'request-promise';

export const reptileTargetUrl = async url =>
    request({
        url,
        method: 'GET',
        encoding: null,
    });
