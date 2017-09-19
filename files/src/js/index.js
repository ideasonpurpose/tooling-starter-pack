/* eslint-env browser, es6 */
/* eslint no-unused-vars: ["error", {"vars": "local"}] */
/* global __webpack_public_path__:true */

const path = require("path");
__webpack_public_path__ =
  path.dirname(document.scripts[document.scripts.length - 1].src) + "/";

const $ = require("jquery");
window.$ = $;
window.jQuery = $;
