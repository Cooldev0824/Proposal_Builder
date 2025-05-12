module.exports = {
  "*.{js,ts,vue}": [
    "eslint --fix",
    "prettier --write",
  ],
  "*.{css,scss,less}": [
    "prettier --write",
  ],
  "*.{json,md}": [
    "prettier --write",
  ],
};
