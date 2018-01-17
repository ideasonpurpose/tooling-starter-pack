# IOP Tooling Starter Pack

Version 0.2.1

This boilerplate is purely about tooling, it is theme agnostic and can be used with any theme files.

These are the common tools we use to build out web projects at IOP. App configs and dotfiles include:

* [gulp][]
* [Browsersync][]
* [Autoprefixer][]
* [webpack][]
* [Browserslist][]
* [CSScomb][]
* [EditorConfig][]
* [ESLint][]

When working on a site with these tools, the following npm scripts are available:

* **`npm run start`** (or just `npm start`)  
   Starts a local server and watches files for changes (currently `gulp watch` with Browsersync)
* **`npm run build`**  
   Builds the project (currently `gulp build` with `NODE_ENV=production`)
* **`npm run version`**  
   Versions files with [version-everything]
* **`npm run webpack`**  
   Runs webpack with `NODE_ENV=production`
* **`npm run webpack-stats`**  
  Runs webpack and starts a [Webpack Bundle Analyzer][] server instance

Besides bootstrapping new projects, this is intended to be the single source of truth for the included configuration files. Instead of trying to keep track of which project has the most recent version, changes will be pushed here.

All files are versioned with [version-everything][] to help track additions and regressions.

## Installation

```lang-sh
$ npm -g install ideasonpurpose/tooling-starter-pack
```

The `wpinit` command expects and will create a project directory structure like this:

```lang-text
Project-Name
└─┬ site
  └─┬ wp-content
    └── themes
```

$ cd Project-Name`
$ npm install ideasonpurpose/tooling-starter-pack
$ $(npm bin)/wpinit

## Commands

### wpinit

Currently `wpinit` is the only command and is focused on building out a WordPress site. Here's what it does:

1. Creates a theme folder if none exists (prompts for name)
2. Creates `wp-content/themes/[theme]/src` and `wp-content/themes/[theme]/dist` directories.
3. Copies starter Sass and JS files into `src`.
4. Copies our default set of dotfiles:
   * `.browserslistrc`
   * `.csscomb.json`
   * `.editorconfig`
   * `.eslint.js`
5. Copy and customize **package.json** and **composer.json** files into the theme root, merging some fields if the files already exist.
6. Run `npm install` and `composer install`
7. Inject a consistent directory structure into the theme file:

```lang-text
        Theme root
        ├── acf-json
        ├── dist
        ├── lib
        └─┬ src
          ├── images
          ├── js
          └── scss
```

When it's done, the site should be buildable:

```lang-sh
$ cd site
$ gulp build
```

This is still very beta, but it should be non-destructive and safe to use on top of existing themes. Backup files and use Git to be safe.

## Conventions

For WordPress themes, the `name` in **package.json** should be the same as theme-directory. Scripts will use that key to find the theme files.

<!-- 
## Leftovers

Alternate naming ideas:

* Tooling Kickstart
* web-toolchain
* web toolbox
* IOP Web Toolbox
* IOP bag-o-tricks
* Tooling Starter Pack
* tool baseline
* foundation tools
* build chain starter pack
--> 

[version-everything]: https://www.npmjs.com/package/version-everything
[gulp]: https://gulpjs.com
[browsersync]: https://www.browsersync.io
[autoprefixer]: https://github.com/postcss/autoprefixer
[webpack]: https://webpack.js.org
[browserslist]: https://browserl.ist
[csscomb]: http://csscomb.com
[editorconfig]: http://editorconfig.org
[eslint]: https://eslint.org
[webpack bundle analyzer]: https://github.com/webpack-contrib/webpack-bundle-analyzer
