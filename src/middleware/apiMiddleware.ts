import axios from 'axios';
import { Dispatch, MiddlewareAPI } from 'redux';

import { LOADING_COMPLETED, SET_LOADING } from 'src/reducers/common';
import { getAuthToken } from 'src/utils/common';

export const callApi = <Params, Body, Headers>(
  endpoint: string,
  method: string,
  params: Params,
  body: Body,
  headers: Headers,
  authenticated: boolean
) => {
  const mandatoryHeaders = {
    'Content-Type': 'application/json',
    Authorization: '',
  };
  const token = getAuthToken();
  if (authenticated) {
    if (token) {
      mandatoryHeaders.Authorization = `Bearer ${token}`;
    } else {
      throw new Error('No token saved!');
    }
  }

  const requestHeaders = { ...mandatoryHeaders, ...headers };
  const config = {
    method,
    params,
    headers: requestHeaders,
    data: body,
    url: process.env.SERVER_URL + endpoint,
  };

  return axios
    .request(config)
    .then(response => response.data)
    .catch(error => {
      throw error;
    });
};

export const CALL_API = Symbol('CALL_API');

export default (store: MiddlewareAPI) => (next: Dispatch<ReduxAction>) => (action: APIAction & ReduxAction) => {
  const callAPI = action.CALL_API;

  if (typeof callAPI === 'undefined') {
    return next(action);
  }

  const { endpoint, method, params, body, headers, actions, authenticated, loadingPageType } = callAPI;

  if (loadingPageType) {
    store.dispatch({ type: SET_LOADING, payload: { page: loadingPageType } });
  }

  const { error, success } = actions;

  const loadingComplete = () => {
    if (loadingPageType) {
      store.dispatch({
        type: LOADING_COMPLETED,
        payload: { page: loadingPageType },
      });
    }
  };

  return callApi(endpoint, method, params, body, headers, authenticated).then(
    response => {
      loadingComplete();

      return next({
        payload: response,
        type: success,
      });
    },
    err => {
      loadingComplete();

      return next({
        error: err,
        type: error,
      });
    }
  );
};
