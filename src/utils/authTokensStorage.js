const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const authTokensStorage = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  save({ accessToken, refreshToken }) {
    if (accessToken) { localStorage.setItem(ACCESS_TOKEN_KEY, accessToken); }
    if (refreshToken) { localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken); }
  },

  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};
