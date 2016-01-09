'use strict';

var ge = {
    element: null,      // git-edit element, <x></x>
    editor: null,       // ace editor element
    parentNode: null,   // the element for which git-edit is created
    connection: null,   // github connection info
    github: null,       // github api
    baserepo: null,     // base repository from we read content
    headrepo: null,     // head repository for not owner users that want to pull request to base repo.
    username: 'guest',  // github username, default - guest
    userinfo: null      // user info
};

// include external scripts
document.write('<link rel="stylesheet" href="https://rawgit.com/chinchang/hint.css/master/hint.min.css">')
document.write('<link href="//maxcdn.bootstrapcdn.com/font-awesome/4.1.0/css/font-awesome.min.css" rel="stylesheet">')
document.write('<script src="https://rawgit.com/michael/github/v0.10.7/github.js"></script>');
document.write('<script src="https://rawgit.com/ajaxorg/ace-builds/master/src-min-noconflict/ace.js" type="text/javascript" charset="utf-8"></script>');
document.write('<script src="https://rawgit.com/ajaxorg/ace-builds/master/src-min-noconflict/ext-language_tools.js" type="text/javascript" charset="utf-8"></script>');

// IsConnectedToGithubEvent event is emitted by 'git-connect.js' plugin
document.addEventListener('IsConnectedToGithubEvent', function(e){
    // get connection info after user is connected to github
    ge.connection = e.detail;

    //initialize github api
    ge.github = new Github({
        token: ge.connection.getCookie('github_access_token'),
        auth: "oauth"
    });

    //get base github repo using connection config
    ge.baserepo = ge.github.getRepo(ge.connection.config['owner'], ge.connection.config['reponame']);

    //get username and userinfo
    ge.connection.withCredentials(function(err, username, access_token, userinfo){
        if (err === null){
            ge.username = username;
            ge.userinfo = userinfo;
        } else {
            console.log('Credentials are not valid... \nError: '+err);
        }
    })
});

// IsDisconnectedFromGithubEvent event is emitted by 'git-connect.js' plugin
document.addEventListener('IsDisconnectedFromGithubEvent', function(e){
    // clear all github info after user is disconnected from github
    ge.connection = null;
    ge.github = null;
    ge.baserepo = null;
    ge.username = 'guest';
});

// Initialize editor on click for any element that marked with class 'gitedit'
addGitEditListeners();
function addGitEditListeners(){
    var els = document.querySelectorAll('.gitedit')
    for (var i=0;i< els.length;i++){
        els[i].addEventListener('click', function(e){
            if (e.ctrlKey && !ge.element) initEditor(this, e);
            e.stopPropagation();
        });
    };
}

// Initialize git editor
function initEditor(parent, event){
    if (ge.github){
        ge.parentNode = parent;
        // create editor element
        ge.element = document.createElement('x');
        ge.element.className += ' fullScreen';
        ge.element.setAttribute('role','splitV');
        ge.element.style.top = Math.round(event.y + window.pageYOffset) + 'px';
        ge.element.style.left = Math.round(event.x + window.pageXOffset) + 'px';
        ge.parentNode.appendChild(ge.element);
        ge.element.innerHTML =
            '<nav class="e-header">' +
                '<button onclick="toggleCssClass(ge.element, \'fullScreen\'); toggleCssClass(this.querySelector(\'i\'),\'fa-expand\'); toggleCssClass(this.querySelector(\'i\'),\'fa-compress\')"><i class="fa fa-expand"></i></button>' +
                '<div class="labels">' +
                    '<span>' + ge.username + '</span>' +
                    '<label><input type="radio" name="viewType" value="splitH"/>SplitH</label>' +
                    '<label><input type="radio" name="viewType" checked="checked" value="splitV"/>SplitV</label>' +
                    '<label><input type="radio" name="viewType" value="code"/>Code</label>' +
                    '<label><input type="radio" name="viewType" value="preview"/>Preview</label>' +
                '</div>' +
            '</nav>' +
            '<div class="e-body">' +
                '<div role="input"><pre class=e id=editor></pre></div>' +
                '<div role="output"><iframe class=e id=preview></iframe></div>' +
            '</div>' +
            '<div class="e-footer">' +
                '<img src='+ge.userinfo['avatar_url']+'>' +
                '<div class="commit-form">' +
                    '<h3 class="heading">Commit changes</h3>' +
                    '<input id=message class="message" placeholder="Update '+ge.parentNode.dataset['file']+'">' +
                    '<textarea id=description class="description" placeholder="Add an optional extended description..."></textarea>' +
                    '<div class="actions"><button class="cancel-btn" onclick="removeEditor()">Cancel</button><button class="commit-btn"  onclick="writeToRepo(ge.editor.getSession().getValue(), message.value, description.value)">Commit & Pull</button></div>' +
                '</div>' +
            '</div>';

        // get content from base repository
        readFromRepo();

        // initialize ace editor
        ge.editor = ace.edit(editor);
        ge.editor.setTheme("ace/theme/twilight");
        ge.editor.setOptions({
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: false
        });

        ge.editor.getSession().setMode("ace/mode/html");
        ge.editor.getSession().on('change', function(){
            preview.srcdoc=ge.editor.getSession().getValue();
        });

        // Set tooltips
        if (ge.username !== ge.connection.config['owner']){
            var commitBtn = ge.element.querySelector(".commit-btn");
            commitBtn.className += ' hint--top hint--no-animate';
            commitBtn.setAttribute('data-hint','The repo will automatically forked.');
        }

        // view switcher
        var nav = ge.element.querySelector(".e-header");
        nav.addEventListener("click", function(){
            ge.element.setAttribute("role", nav.querySelector("input:checked").value);
            ge.editor.resize();
        })
    } else {
        alert('You should connect to Github.');
        try {
            window.connection.connect();
        } catch (e){
            alert('Connection problems... \nError: '+e)
        }
    }
}

// Remove git editor
function removeEditor(){
    ge.parentNode.removeChild(ge.element);
    ge.element = null;
}

// Get content from baserepo and push it to editor
function readFromRepo(){
    if (ge.baserepo){
        ge.baserepo.read(ge.parentNode.dataset['branch'], ge.parentNode.dataset['file'], function(err, data) {
            if (err === null) {
                editor.env.editor.setValue(data, 1);
            } else {
                alert('Content is not loaded from '+ge.connection.config['owner']+'/'+ge.connection.config['reponame']+'/'+ge.parentNode.dataset['branch']+'/'+ge.parentNode.dataset['file']+' ... \nError: '+err);
                removeEditor();
            }
        });
    }
}

// Write the changes to github.
// If user is not owner then baserepo is automatically forked to headrepo and any changes are pulled from head to base.
function writeToRepo(content, msg, desc){
    if (ge.github){
        // if user is owner
        if (ge.username === ge.connection.config['owner']){
            ge.baserepo.write(ge.parentNode.dataset['branch'], ge.parentNode.dataset['file'], content, msg, function(err, sha) {
                if (err === null) {
                    alert('The changes are commited successfully!');
                    removeEditor();
                } else {
                    alert('Content is not updated... \nError: '+err);
                }
            });
        } else {
            // for not owner users the base repo should be forked automatically
            ge.baserepo.fork(function(err, fork) {
                if (err === null) {
                    ge.headrepo = ge.github.getRepo(ge.username, fork.name);
                    ge.headrepo.write(ge.parentNode.dataset['branch'], ge.parentNode.dataset['file'], content, msg, function(err, sha) {
                        if (err === null) {
                            var pull = {
                                title: msg,
                                body: desc,
                                base: ge.parentNode.dataset['branch'],
                                head: ge.username + ":" + ge.parentNode.dataset['branch']
                            };
                            ge.baserepo.createPullRequest(pull, function(err, pullRequest) {
                                alert('The changes are commited & pulled successfully!');
                                removeEditor();
                            });
                        } else {
                            alert('Content is not updated in Your forked repository... \nError: '+err);
                        }
                    });
                } else {
                    alert('Base repository is not forked... \nError: '+err);
                }
            });
        }
    } else {
        alert('Sorry, you are not connected to github...')
    }
};

// Toggle css class
function toggleCssClass(element, name){
    var classes = element.className.split(/\s+/g), add = true;
    while (true) {
        var index = classes.indexOf(name);
        if (index == -1) break;
        add = false;
        classes.splice(index, 1);
    }
    if (add) classes.push(name);

    element.className = classes.join(" ");
    return add;
}