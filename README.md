# IOP Tooling Starter Pack

This boilerplate is purely about tooling, it is theme agnostic and can be used with any theme files.

These are the common tools we use to build out our WordPress projects. Project 
The process we use for building out a new WordPress project. This includes:

Bsides bootstrapping new projects, this is intended to be the single source of truth for the included config files. Instead of trying to keep track of which project has the most recent version, changes will be pushed here.

TODO: 
	1. Figure out if we're above wp-content or parallel to it. 
	3. This should be installed with npm direct from the GitHub repo, process goes something like this:

##Installation

The wpinit command expects project expects a directory structure like this:

```
Project-Name
└─┬ site
  └─┬ wp-content
 	  └── themes
```

$ cd Project-Name`
$ npm install ideasonpurpose/tooling-starter-pack
$ $(npm bin)/wpinit

## wpinit

Currently this is the only command, `wpinit` which is focused on building out a WordPress site. 

Here's what it does:

Creates a theme folder if none exists (prompts for name)
Creates `wp-content/themes/[theme]/src` and `wp-content/themes/[theme]/dist` directories.

Copies starter Sass and JS files into `src`.

Copies our default set of dotfiles:

* `.browserslistrc`
* `.csscomb.json`
* `.editorconfig`
* `.eslint.js`

Copy and customize **package.json** **composer.json** file into the theme root, merging some fields if the files already exist. 

Runs `npm install` and `composer install`

Inject a consistent directory structure into the theme file:
    
```
Theme root
├── acf-json
├── dist
├── lib
├─┬ src
│ ├── images
│ ├── js
│ └── scss
```



When it's done, the site should be buildable:
```
$ cd site
$ gulp build
```




## Leftovers

Alternate naming ideas:

Tooling Kickstart
web-toolchain
web toolbox
IOP Web Toolbox
IOP bag-o-tricks
Tooling Starter Pack
tool baseline
foundation tools
build chain starter pack
