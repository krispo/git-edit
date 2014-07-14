Git-Edit
==

A small javascript plugin that allows to edit web pages directly from the browser at specific place with live preview and commit the changes to github.

It uses internally:

* [Ace Editor](https://github.com/ajaxorg/ace) - awesome code editor.
* [Github](https://github.com/michael/github) - a higher-level wrapper around the Github API.
* [Font Awesome](https://github.com/FortAwesome/Font-Awesome) - The iconic font and CSS toolkit.
* [Hint](https://github.com/chinchang/hint.css) - A tooltip library in CSS.

And it used along with

* Installed [git-proxy](https://github.com/krispo/git-proxy) - it is needed for correct github authentication/authorization
* [git-connect](https://github.com/krispo/git-connect) - it is a plugin that provides github OAuth only within the browser.

## How to use

Add this scripts to the end of your html `body`:
```html
<link rel="stylesheet" href="https://rawgit.com/krispo/git-edit/master/git-edit.css">
<script src="https://rawgit.com/krispo/git-connect/master/git-connect.js"></script>
<script src="https://rawgit.com/krispo/git-edit/master/git-edit.js"></script>
```
And then initialize [connection](https://github.com/krispo/git-connect) with adding this script after:
```html
<script>
    window.connection({
        client_id: "sdfjhg23jhg345j33io", //your application client_id
        proxy: "http://git-proxy.herokuapp.com", //your git proxy
        owner: "krispo", //your github username
        reponame: "git-edit" //your reponame
    })
</script>
```

You should mark the html element, that you want to edit, with `gitedit` class,
and add info with `data-*` attribute for branch and main file, for example:
```html
<body class="gitedit" data-branch="gh-pages" data-file="index.html">
    ...
</body>
```

Now if you deploy your app, you can call editor by `CTRL + Click` with click on your marked element.
And then `edit` web page and `commit` the changes. You web page will updated immediately.

Actually, your web page can be edited by any github user that connected to github through your app.
And these changes will be like a `pull requests`.
So, after `commit & pull` this repo will be forked automatically to this user github account.

---
Try [demo](http://krispo.github.io/git-edit).


