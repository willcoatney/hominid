(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    
    require.define = function (filename, fn) {
        if (require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return window.setImmediate;
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/app/vendor/js/bootstrap.min.js",function(require,module,exports,__dirname,__filename,process){/**
* Bootstrap.js by @fat & @mdo
* Copyright 2012 Twitter, Inc.
* http://www.apache.org/licenses/LICENSE-2.0.txt
*/
!function(a){a(function(){"use strict",a.support.transition=function(){var b=document.body||document.documentElement,c=b.style,d=c.transition!==undefined||c.WebkitTransition!==undefined||c.MozTransition!==undefined||c.MsTransition!==undefined||c.OTransition!==undefined;return d&&{end:function(){var b="TransitionEnd";return a.browser.webkit?b="webkitTransitionEnd":a.browser.mozilla?b="transitionend":a.browser.opera&&(b="oTransitionEnd"),b}()}}()})}(window.jQuery),!function(a){"use strict";var b='[data-dismiss="alert"]',c=function(c){a(c).on("click",b,this.close)};c.prototype={constructor:c,close:function(b){function f(){e.trigger("closed").remove()}var c=a(this),d=c.attr("data-target"),e;d||(d=c.attr("href"),d=d&&d.replace(/.*(?=#[^\s]*$)/,"")),e=a(d),e.trigger("close"),b&&b.preventDefault(),e.length||(e=c.hasClass("alert")?c:c.parent()),e.trigger("close").removeClass("in"),a.support.transition&&e.hasClass("fade")?e.on(a.support.transition.end,f):f()}},a.fn.alert=function(b){return this.each(function(){var d=a(this),e=d.data("alert");e||d.data("alert",e=new c(this)),typeof b=="string"&&e[b].call(d)})},a.fn.alert.Constructor=c,a(function(){a("body").on("click.alert.data-api",b,c.prototype.close)})}(window.jQuery),!function(a){"use strict";var b=function(b,c){this.$element=a(b),this.options=a.extend({},a.fn.button.defaults,c)};b.prototype={constructor:b,setState:function(a){var b="disabled",c=this.$element,d=c.data(),e=c.is("input")?"val":"html";a+="Text",d.resetText||c.data("resetText",c[e]()),c[e](d[a]||this.options[a]),setTimeout(function(){a=="loadingText"?c.addClass(b).attr(b,b):c.removeClass(b).removeAttr(b)},0)},toggle:function(){var a=this.$element.parent('[data-toggle="buttons-radio"]');a&&a.find(".active").removeClass("active"),this.$element.toggleClass("active")}},a.fn.button=function(c){return this.each(function(){var d=a(this),e=d.data("button"),f=typeof c=="object"&&c;e||d.data("button",e=new b(this,f)),c=="toggle"?e.toggle():c&&e.setState(c)})},a.fn.button.defaults={loadingText:"loading..."},a.fn.button.Constructor=b,a(function(){a("body").on("click.button.data-api","[data-toggle^=button]",function(b){var c=a(b.target);c.hasClass("btn")||(c=c.closest(".btn")),c.button("toggle")})})}(window.jQuery),!function(a){"use strict";var b=function(b,c){this.$element=a(b),this.options=a.extend({},a.fn.carousel.defaults,c),this.options.slide&&this.slide(this.options.slide),this.options.pause=="hover"&&this.$element.on("mouseenter",a.proxy(this.pause,this)).on("mouseleave",a.proxy(this.cycle,this))};b.prototype={cycle:function(){return this.interval=setInterval(a.proxy(this.next,this),this.options.interval),this},to:function(b){var c=this.$element.find(".active"),d=c.parent().children(),e=d.index(c),f=this;if(b>d.length-1||b<0)return;return this.sliding?this.$element.one("slid",function(){f.to(b)}):e==b?this.pause().cycle():this.slide(b>e?"next":"prev",a(d[b]))},pause:function(){return clearInterval(this.interval),this.interval=null,this},next:function(){if(this.sliding)return;return this.slide("next")},prev:function(){if(this.sliding)return;return this.slide("prev")},slide:function(b,c){var d=this.$element.find(".active"),e=c||d[b](),f=this.interval,g=b=="next"?"left":"right",h=b=="next"?"first":"last",i=this;this.sliding=!0,f&&this.pause(),e=e.length?e:this.$element.find(".item")[h]();if(e.hasClass("active"))return;return!a.support.transition&&this.$element.hasClass("slide")?(this.$element.trigger("slide"),d.removeClass("active"),e.addClass("active"),this.sliding=!1,this.$element.trigger("slid")):(e.addClass(b),e[0].offsetWidth,d.addClass(g),e.addClass(g),this.$element.trigger("slide"),this.$element.one(a.support.transition.end,function(){e.removeClass([b,g].join(" ")).addClass("active"),d.removeClass(["active",g].join(" ")),i.sliding=!1,setTimeout(function(){i.$element.trigger("slid")},0)})),f&&this.cycle(),this}},a.fn.carousel=function(c){return this.each(function(){var d=a(this),e=d.data("carousel"),f=typeof c=="object"&&c;e||d.data("carousel",e=new b(this,f)),typeof c=="number"?e.to(c):typeof c=="string"||(c=f.slide)?e[c]():e.cycle()})},a.fn.carousel.defaults={interval:5e3,pause:"hover"},a.fn.carousel.Constructor=b,a(function(){a("body").on("click.carousel.data-api","[data-slide]",function(b){var c=a(this),d,e=a(c.attr("data-target")||(d=c.attr("href"))&&d.replace(/.*(?=#[^\s]+$)/,"")),f=!e.data("modal")&&a.extend({},e.data(),c.data());e.carousel(f),b.preventDefault()})})}(window.jQuery),!function(a){"use strict";var b=function(b,c){this.$element=a(b),this.options=a.extend({},a.fn.collapse.defaults,c),this.options.parent&&(this.$parent=a(this.options.parent)),this.options.toggle&&this.toggle()};b.prototype={constructor:b,dimension:function(){var a=this.$element.hasClass("width");return a?"width":"height"},show:function(){var b=this.dimension(),c=a.camelCase(["scroll",b].join("-")),d=this.$parent&&this.$parent.find(".in"),e;d&&d.length&&(e=d.data("collapse"),d.collapse("hide"),e||d.data("collapse",null)),this.$element[b](0),this.transition("addClass","show","shown"),this.$element[b](this.$element[0][c])},hide:function(){var a=this.dimension();this.reset(this.$element[a]()),this.transition("removeClass","hide","hidden"),this.$element[a](0)},reset:function(a){var b=this.dimension();return this.$element.removeClass("collapse")[b](a||"auto")[0].offsetWidth,this.$element[a?"addClass":"removeClass"]("collapse"),this},transition:function(b,c,d){var e=this,f=function(){c=="show"&&e.reset(),e.$element.trigger(d)};this.$element.trigger(c)[b]("in"),a.support.transition&&this.$element.hasClass("collapse")?this.$element.one(a.support.transition.end,f):f()},toggle:function(){this[this.$element.hasClass("in")?"hide":"show"]()}},a.fn.collapse=function(c){return this.each(function(){var d=a(this),e=d.data("collapse"),f=typeof c=="object"&&c;e||d.data("collapse",e=new b(this,f)),typeof c=="string"&&e[c]()})},a.fn.collapse.defaults={toggle:!0},a.fn.collapse.Constructor=b,a(function(){a("body").on("click.collapse.data-api","[data-toggle=collapse]",function(b){var c=a(this),d,e=c.attr("data-target")||b.preventDefault()||(d=c.attr("href"))&&d.replace(/.*(?=#[^\s]+$)/,""),f=a(e).data("collapse")?"toggle":c.data();a(e).collapse(f)})})}(window.jQuery),!function(a){function d(){a(b).parent().removeClass("open")}"use strict";var b='[data-toggle="dropdown"]',c=function(b){var c=a(b).on("click.dropdown.data-api",this.toggle);a("html").on("click.dropdown.data-api",function(){c.parent().removeClass("open")})};c.prototype={constructor:c,toggle:function(b){var c=a(this),e=c.attr("data-target"),f,g;return e||(e=c.attr("href"),e=e&&e.replace(/.*(?=#[^\s]*$)/,"")),f=a(e),f.length||(f=c.parent()),g=f.hasClass("open"),d(),!g&&f.toggleClass("open"),!1}},a.fn.dropdown=function(b){return this.each(function(){var d=a(this),e=d.data("dropdown");e||d.data("dropdown",e=new c(this)),typeof b=="string"&&e[b].call(d)})},a.fn.dropdown.Constructor=c,a(function(){a("html").on("click.dropdown.data-api",d),a("body").on("click.dropdown.data-api",b,c.prototype.toggle)})}(window.jQuery),!function(a){function c(){var b=this,c=setTimeout(function(){b.$element.off(a.support.transition.end),d.call(b)},500);this.$element.one(a.support.transition.end,function(){clearTimeout(c),d.call(b)})}function d(a){this.$element.hide().trigger("hidden"),e.call(this)}function e(b){var c=this,d=this.$element.hasClass("fade")?"fade":"";if(this.isShown&&this.options.backdrop){var e=a.support.transition&&d;this.$backdrop=a('<div class="modal-backdrop '+d+'" />').appendTo(document.body),this.options.backdrop!="static"&&this.$backdrop.click(a.proxy(this.hide,this)),e&&this.$backdrop[0].offsetWidth,this.$backdrop.addClass("in"),e?this.$backdrop.one(a.support.transition.end,b):b()}else!this.isShown&&this.$backdrop?(this.$backdrop.removeClass("in"),a.support.transition&&this.$element.hasClass("fade")?this.$backdrop.one(a.support.transition.end,a.proxy(f,this)):f.call(this)):b&&b()}function f(){this.$backdrop.remove(),this.$backdrop=null}function g(){var b=this;this.isShown&&this.options.keyboard?a(document).on("keyup.dismiss.modal",function(a){a.which==27&&b.hide()}):this.isShown||a(document).off("keyup.dismiss.modal")}"use strict";var b=function(b,c){this.options=c,this.$element=a(b).delegate('[data-dismiss="modal"]',"click.dismiss.modal",a.proxy(this.hide,this))};b.prototype={constructor:b,toggle:function(){return this[this.isShown?"hide":"show"]()},show:function(){var b=this;if(this.isShown)return;a("body").addClass("modal-open"),this.isShown=!0,this.$element.trigger("show"),g.call(this),e.call(this,function(){var c=a.support.transition&&b.$element.hasClass("fade");!b.$element.parent().length&&b.$element.appendTo(document.body),b.$element.show(),c&&b.$element[0].offsetWidth,b.$element.addClass("in"),c?b.$element.one(a.support.transition.end,function(){b.$element.trigger("shown")}):b.$element.trigger("shown")})},hide:function(b){b&&b.preventDefault();if(!this.isShown)return;var e=this;this.isShown=!1,a("body").removeClass("modal-open"),g.call(this),this.$element.trigger("hide").removeClass("in"),a.support.transition&&this.$element.hasClass("fade")?c.call(this):d.call(this)}},a.fn.modal=function(c){return this.each(function(){var d=a(this),e=d.data("modal"),f=a.extend({},a.fn.modal.defaults,d.data(),typeof c=="object"&&c);e||d.data("modal",e=new b(this,f)),typeof c=="string"?e[c]():f.show&&e.show()})},a.fn.modal.defaults={backdrop:!0,keyboard:!0,show:!0},a.fn.modal.Constructor=b,a(function(){a("body").on("click.modal.data-api",'[data-toggle="modal"]',function(b){var c=a(this),d,e=a(c.attr("data-target")||(d=c.attr("href"))&&d.replace(/.*(?=#[^\s]+$)/,"")),f=e.data("modal")?"toggle":a.extend({},e.data(),c.data());b.preventDefault(),e.modal(f)})})}(window.jQuery),!function(a){"use strict";var b=function(a,b){this.init("tooltip",a,b)};b.prototype={constructor:b,init:function(b,c,d){var e,f;this.type=b,this.$element=a(c),this.options=this.getOptions(d),this.enabled=!0,this.options.trigger!="manual"&&(e=this.options.trigger=="hover"?"mouseenter":"focus",f=this.options.trigger=="hover"?"mouseleave":"blur",this.$element.on(e,this.options.selector,a.proxy(this.enter,this)),this.$element.on(f,this.options.selector,a.proxy(this.leave,this))),this.options.selector?this._options=a.extend({},this.options,{trigger:"manual",selector:""}):this.fixTitle()},getOptions:function(b){return b=a.extend({},a.fn[this.type].defaults,b,this.$element.data()),b.delay&&typeof b.delay=="number"&&(b.delay={show:b.delay,hide:b.delay}),b},enter:function(b){var c=a(b.currentTarget)[this.type](this._options).data(this.type);!c.options.delay||!c.options.delay.show?c.show():(c.hoverState="in",setTimeout(function(){c.hoverState=="in"&&c.show()},c.options.delay.show))},leave:function(b){var c=a(b.currentTarget)[this.type](this._options).data(this.type);!c.options.delay||!c.options.delay.hide?c.hide():(c.hoverState="out",setTimeout(function(){c.hoverState=="out"&&c.hide()},c.options.delay.hide))},show:function(){var a,b,c,d,e,f,g;if(this.hasContent()&&this.enabled){a=this.tip(),this.setContent(),this.options.animation&&a.addClass("fade"),f=typeof this.options.placement=="function"?this.options.placement.call(this,a[0],this.$element[0]):this.options.placement,b=/in/.test(f),a.remove().css({top:0,left:0,display:"block"}).appendTo(b?this.$element:document.body),c=this.getPosition(b),d=a[0].offsetWidth,e=a[0].offsetHeight;switch(b?f.split(" ")[1]:f){case"bottom":g={top:c.top+c.height,left:c.left+c.width/2-d/2};break;case"top":g={top:c.top-e,left:c.left+c.width/2-d/2};break;case"left":g={top:c.top+c.height/2-e/2,left:c.left-d};break;case"right":g={top:c.top+c.height/2-e/2,left:c.left+c.width}}a.css(g).addClass(f).addClass("in")}},setContent:function(){var a=this.tip();a.find(".tooltip-inner").html(this.getTitle()),a.removeClass("fade in top bottom left right")},hide:function(){function d(){var b=setTimeout(function(){c.off(a.support.transition.end).remove()},500);c.one(a.support.transition.end,function(){clearTimeout(b),c.remove()})}var b=this,c=this.tip();c.removeClass("in"),a.support.transition&&this.$tip.hasClass("fade")?d():c.remove()},fixTitle:function(){var a=this.$element;(a.attr("title")||typeof a.attr("data-original-title")!="string")&&a.attr("data-original-title",a.attr("title")||"").removeAttr("title")},hasContent:function(){return this.getTitle()},getPosition:function(b){return a.extend({},b?{top:0,left:0}:this.$element.offset(),{width:this.$element[0].offsetWidth,height:this.$element[0].offsetHeight})},getTitle:function(){var a,b=this.$element,c=this.options;return a=b.attr("data-original-title")||(typeof c.title=="function"?c.title.call(b[0]):c.title),a=(a||"").toString().replace(/(^\s*|\s*$)/,""),a},tip:function(){return this.$tip=this.$tip||a(this.options.template)},validate:function(){this.$element[0].parentNode||(this.hide(),this.$element=null,this.options=null)},enable:function(){this.enabled=!0},disable:function(){this.enabled=!1},toggleEnabled:function(){this.enabled=!this.enabled},toggle:function(){this[this.tip().hasClass("in")?"hide":"show"]()}},a.fn.tooltip=function(c){return this.each(function(){var d=a(this),e=d.data("tooltip"),f=typeof c=="object"&&c;e||d.data("tooltip",e=new b(this,f)),typeof c=="string"&&e[c]()})},a.fn.tooltip.Constructor=b,a.fn.tooltip.defaults={animation:!0,delay:0,selector:!1,placement:"top",trigger:"hover",title:"",template:'<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'}}(window.jQuery),!function(a){"use strict";var b=function(a,b){this.init("popover",a,b)};b.prototype=a.extend({},a.fn.tooltip.Constructor.prototype,{constructor:b,setContent:function(){var b=this.tip(),c=this.getTitle(),d=this.getContent();b.find(".popover-title")[a.type(c)=="object"?"append":"html"](c),b.find(".popover-content > *")[a.type(d)=="object"?"append":"html"](d),b.removeClass("fade top bottom left right in")},hasContent:function(){return this.getTitle()||this.getContent()},getContent:function(){var a,b=this.$element,c=this.options;return a=b.attr("data-content")||(typeof c.content=="function"?c.content.call(b[0]):c.content),a=a.toString().replace(/(^\s*|\s*$)/,""),a},tip:function(){return this.$tip||(this.$tip=a(this.options.template)),this.$tip}}),a.fn.popover=function(c){return this.each(function(){var d=a(this),e=d.data("popover"),f=typeof c=="object"&&c;e||d.data("popover",e=new b(this,f)),typeof c=="string"&&e[c]()})},a.fn.popover.Constructor=b,a.fn.popover.defaults=a.extend({},a.fn.tooltip.defaults,{placement:"right",content:"",template:'<div class="popover"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'})}(window.jQuery),!function(a){function b(b,c){var d=a.proxy(this.process,this),e=a(b).is("body")?a(window):a(b),f;this.options=a.extend({},a.fn.scrollspy.defaults,c),this.$scrollElement=e.on("scroll.scroll.data-api",d),this.selector=(this.options.target||(f=a(b).attr("href"))&&f.replace(/.*(?=#[^\s]+$)/,"")||"")+" .nav li > a",this.$body=a("body").on("click.scroll.data-api",this.selector,d),this.refresh(),this.process()}"use strict",b.prototype={constructor:b,refresh:function(){this.targets=this.$body.find(this.selector).map(function(){var b=a(this).attr("href");return/^#\w/.test(b)&&a(b).length?b:null}),this.offsets=a.map(this.targets,function(b){return a(b).position().top})},process:function(){var a=this.$scrollElement.scrollTop()+this.options.offset,b=this.offsets,c=this.targets,d=this.activeTarget,e;for(e=b.length;e--;)d!=c[e]&&a>=b[e]&&(!b[e+1]||a<=b[e+1])&&this.activate(c[e])},activate:function(a){var b;this.activeTarget=a,this.$body.find(this.selector).parent(".active").removeClass("active"),b=this.$body.find(this.selector+'[href="'+a+'"]').parent("li").addClass("active"),b.parent(".dropdown-menu")&&b.closest("li.dropdown").addClass("active")}},a.fn.scrollspy=function(c){return this.each(function(){var d=a(this),e=d.data("scrollspy"),f=typeof c=="object"&&c;e||d.data("scrollspy",e=new b(this,f)),typeof c=="string"&&e[c]()})},a.fn.scrollspy.Constructor=b,a.fn.scrollspy.defaults={offset:10},a(function(){a('[data-spy="scroll"]').each(function(){var b=a(this);b.scrollspy(b.data())})})}(window.jQuery),!function(a){"use strict";var b=function(b){this.element=a(b)};b.prototype={constructor:b,show:function(){var b=this.element,c=b.closest("ul:not(.dropdown-menu)"),d=b.attr("data-target"),e,f;d||(d=b.attr("href"),d=d&&d.replace(/.*(?=#[^\s]*$)/,""));if(b.parent("li").hasClass("active"))return;e=c.find(".active a").last()[0],b.trigger({type:"show",relatedTarget:e}),f=a(d),this.activate(b.parent("li"),c),this.activate(f,f.parent(),function(){b.trigger({type:"shown",relatedTarget:e})})},activate:function(b,c,d){function g(){e.removeClass("active").find("> .dropdown-menu > .active").removeClass("active"),b.addClass("active"),f?(b[0].offsetWidth,b.addClass("in")):b.removeClass("fade"),b.parent(".dropdown-menu")&&b.closest("li.dropdown").addClass("active"),d&&d()}var e=c.find("> .active"),f=d&&a.support.transition&&e.hasClass("fade");f?e.one(a.support.transition.end,g):g(),e.removeClass("in")}},a.fn.tab=function(c){return this.each(function(){var d=a(this),e=d.data("tab");e||d.data("tab",e=new b(this)),typeof c=="string"&&e[c]()})},a.fn.tab.Constructor=b,a(function(){a("body").on("click.tab.data-api",'[data-toggle="tab"], [data-toggle="pill"]',function(b){b.preventDefault(),a(this).tab("show")})})}(window.jQuery),!function(a){"use strict";var b=function(b,c){this.$element=a(b),this.options=a.extend({},a.fn.typeahead.defaults,c),this.matcher=this.options.matcher||this.matcher,this.sorter=this.options.sorter||this.sorter,this.highlighter=this.options.highlighter||this.highlighter,this.$menu=a(this.options.menu).appendTo("body"),this.source=this.options.source,this.shown=!1,this.listen()};b.prototype={constructor:b,select:function(){var a=this.$menu.find(".active").attr("data-value");return this.$element.val(a),this.$element.change(),this.hide()},show:function(){var b=a.extend({},this.$element.offset(),{height:this.$element[0].offsetHeight});return this.$menu.css({top:b.top+b.height,left:b.left}),this.$menu.show(),this.shown=!0,this},hide:function(){return this.$menu.hide(),this.shown=!1,this},lookup:function(b){var c=this,d,e;return this.query=this.$element.val(),this.query?(d=a.grep(this.source,function(a){if(c.matcher(a))return a}),d=this.sorter(d),d.length?this.render(d.slice(0,this.options.items)).show():this.shown?this.hide():this):this.shown?this.hide():this},matcher:function(a){return~a.toLowerCase().indexOf(this.query.toLowerCase())},sorter:function(a){var b=[],c=[],d=[],e;while(e=a.shift())e.toLowerCase().indexOf(this.query.toLowerCase())?~e.indexOf(this.query)?c.push(e):d.push(e):b.push(e);return b.concat(c,d)},highlighter:function(a){return a.replace(new RegExp("("+this.query+")","ig"),function(a,b){return"<strong>"+b+"</strong>"})},render:function(b){var c=this;return b=a(b).map(function(b,d){return b=a(c.options.item).attr("data-value",d),b.find("a").html(c.highlighter(d)),b[0]}),b.first().addClass("active"),this.$menu.html(b),this},next:function(b){var c=this.$menu.find(".active").removeClass("active"),d=c.next();d.length||(d=a(this.$menu.find("li")[0])),d.addClass("active")},prev:function(a){var b=this.$menu.find(".active").removeClass("active"),c=b.prev();c.length||(c=this.$menu.find("li").last()),c.addClass("active")},listen:function(){this.$element.on("blur",a.proxy(this.blur,this)).on("keypress",a.proxy(this.keypress,this)).on("keyup",a.proxy(this.keyup,this)),(a.browser.webkit||a.browser.msie)&&this.$element.on("keydown",a.proxy(this.keypress,this)),this.$menu.on("click",a.proxy(this.click,this)).on("mouseenter","li",a.proxy(this.mouseenter,this))},keyup:function(a){switch(a.keyCode){case 40:case 38:break;case 9:case 13:if(!this.shown)return;this.select();break;case 27:if(!this.shown)return;this.hide();break;default:this.lookup()}a.stopPropagation(),a.preventDefault()},keypress:function(a){if(!this.shown)return;switch(a.keyCode){case 9:case 13:case 27:a.preventDefault();break;case 38:a.preventDefault(),this.prev();break;case 40:a.preventDefault(),this.next()}a.stopPropagation()},blur:function(a){var b=this;setTimeout(function(){b.hide()},150)},click:function(a){a.stopPropagation(),a.preventDefault(),this.select()},mouseenter:function(b){this.$menu.find(".active").removeClass("active"),a(b.currentTarget).addClass("active")}},a.fn.typeahead=function(c){return this.each(function(){var d=a(this),e=d.data("typeahead"),f=typeof c=="object"&&c;e||d.data("typeahead",e=new b(this,f)),typeof c=="string"&&e[c]()})},a.fn.typeahead.defaults={source:[],items:8,menu:'<ul class="typeahead dropdown-menu"></ul>',item:'<li><a href="#"></a></li>'},a.fn.typeahead.Constructor=b,a(function(){a("body").on("focus.typeahead.data-api",'[data-provide="typeahead"]',function(b){var c=a(this);if(c.data("typeahead"))return;b.preventDefault(),c.typeahead(c.data())})})}(window.jQuery);
});

require.define("/app/js/views/universal.js",function(require,module,exports,__dirname,__filename,process){jQuery.fn.center = function () {
  this.css("position","absolute");
  this.css("left", ( $(window).width() - this.width() ) / 2+$(window).scrollLeft() + "px");
  this.css("top", ( $(window).height() - this.height() ) / 2+$(window).scrollTop() + "px");
  return this;
}

jQuery.fn.vertical_center = function () {
  this.css("position","absolute");
  this.css("top", ( $(window).height() - this.height() ) / 2+$(window).scrollTop() + "px");
  return this;
}

$(document).ready(function(){

  $('select.loc').on('change', function(){
   var p = $(this).parents('ul')
   var b = $(this).val().split(',')

   p.find('input.city').val(b[0].toString())
   p.find('input.state').val(b[1].toString())
   p.find('input.county').val(b[2].toString())
  });

  $('.chzn-select').chosen();

})

$(window).on('resize', function (){
  $('.center').center()
  $('.vertical-center').vertical_center()
});

$(window).on('load',function(){
  $('.center').center()
  $('.vertical-center').vertical_center()
  $('.fadeIn').fadeIn();
  $('.jsOpacity').animate({
    opacity: 1
  })
 
});

});

require.define("/node_modules/color/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {"main":"./color"}
});

require.define("/node_modules/color/color.js",function(require,module,exports,__dirname,__filename,process){/* MIT license */
var convert = require("color-convert"),
    string = require("color-string");

module.exports = function(cssString) {
   return new Color(cssString);
};

var Color = function(cssString) {
   this.values = {
      rgb: [0, 0, 0],
      hsl: [0, 0, 0],
      hsv: [0, 0, 0],
      cmyk: [0, 0, 0, 0],
      alpha: 1
   } 
   
   // parse Color() argument
   if (typeof cssString == "string") {
      var vals = string.getRgba(cssString);
      if (vals) {  
         this.setValues("rgb", vals);
      }
      else if(vals = string.getHsla(cssString)) {
         this.setValues("hsl", vals);
      }
   }
   else if (typeof cssString == "object") {
      var vals = cssString;
      if(vals["r"] !== undefined || vals["red"] !== undefined) {
         this.setValues("rgb", vals)
      }
      else if(vals["l"] !== undefined || vals["lightness"] !== undefined) {
         this.setValues("hsl", vals)
      }
      else if(vals["v"] !== undefined || vals["value"] !== undefined) {
         this.setValues("hsv", vals)
      }
      else if(vals["c"] !== undefined || vals["cyan"] !== undefined) {
         this.setValues("cmyk", vals)
      }
   }
}

Color.prototype = {
   rgb: function (vals) {
      return this.setSpace("rgb", arguments);
   },
   hsl: function(vals) {
      return this.setSpace("hsl", arguments);
   },
   hsv: function(vals) {
      return this.setSpace("hsv", arguments);
   },
   cmyk: function(vals) {
      return this.setSpace("cmyk", arguments);
   },
   
   rgbArray: function() {
      return this.values.rgb;
   },
   hslArray: function() {
      return this.values.hsl;
   },
   hsvArray: function() {
      return this.values.hsv;
   },
   cmykArray: function() {
      return this.values.cmyk;
   },
   rgbaArray: function() {
      var rgb = this.values.rgb;
      rgb.push(this.values.alpha);
      return rgb;
   },
   hslaArray: function() {
      var hsl = this.values.hsl;
      hsl.push(this.values.alpha);
      return hsl;
   },
         
   alpha: function(val) {
      if (val === undefined) {
         return this.values.alpha;
      }
      this.setValues("alpha", val);
      return this;
   },

   red: function(val) {
      return this.setChannel("rgb", 0, val);
   },
   green: function(val) {
      return this.setChannel("rgb", 1, val);
   },      
   blue: function(val) {
      return this.setChannel("rgb", 2, val);
   },
   hue: function(val) {
      return this.setChannel("hsl", 0, val);
   },
   saturation: function(val) {
      return this.setChannel("hsl", 1, val);
   },
   lightness: function(val) {
      return this.setChannel("hsl", 2, val);
   },
   saturationv: function(val) {
      return this.setChannel("hsv", 1, val);
   },
   value: function(val) {
      return this.setChannel("hsv", 2, val);
   },
   cyan: function(val) {
      return this.setChannel("cmyk", 0, val);
   },
   magenta: function(val) {
      return this.setChannel("cmyk", 1, val);
   },
   yellow: function(val) {
      return this.setChannel("cmyk", 2, val);
   },
   black: function(val) {
      return this.setChannel("cmyk", 3, val);
   },

   hexString: function() {
      return string.hexString(this.values.rgb);
   },
   rgbString: function() {
      return string.rgbString(this.values.rgb, this.values.alpha);
   },
   rgbaString: function() {
      return string.rgbaString(this.values.rgb, this.values.alpha);
   },
   percentString: function() {
      return string.percentString(this.values.rgb, this.values.alpha);
   },
   hslString: function() {
      return string.hslString(this.values.hsl, this.values.alpha); 
   },
   hslaString: function() {
      return string.hslaString(this.values.hsl, this.values.alpha);
   },
   keyword: function() {
      return string.keyword(this.values.rgb, this.values.alpha);
   },
   
   luminosity: function() {
      // http://www.w3.org/TR/WCAG20/#relativeluminancedef
      var rgb = this.values.rgb;
      for (var i = 0; i < rgb.length; i++) {
         var chan = rgb[i] / 255;
         rgb[i] = (chan <= 0.03928) ? chan / 12.92
                  : Math.pow(((chan + 0.055) / 1.055), 2.4)
      }
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
   },
   
   contrast: function(color2) {
      // http://www.w3.org/TR/WCAG20/#contrast-ratiodef
      var lum1 = this.luminosity();
      var lum2 = color2.luminosity();
      if (lum1 > lum2) {
         return (lum1 + 0.05) / (lum2 + 0.05)
      };
      return (lum2 + 0.05) / (lum1 + 0.05);
   },
   
   dark: function() {
      // YIQ equation from http://24ways.org/2010/calculating-color-contrast
      var rgb = this.values.rgb,
          yiq = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
   	return yiq < 128;
   },
   
   light: function() {
      return !this.dark();
   },
    
   negate: function() {
      var rgb = []
      for (var i = 0; i < 3; i++) {
         rgb[i] = 255 - this.values.rgb[i];
      }
      this.setValues("rgb", rgb);
      return this;
   },

   lighten: function(ratio) {
      this.values.hsl[2] += this.values.hsl[2] * ratio;
      this.setValues("hsl", this.values.hsl);
      return this;
   },

   darken: function(ratio) {
      this.values.hsl[2] -= this.values.hsl[2] * ratio;
      this.setValues("hsl", this.values.hsl);
      return this;         
   },
   
   saturate: function(ratio) {
      this.values.hsl[1] += this.values.hsl[1] * ratio;
      this.setValues("hsl", this.values.hsl);
      return this;
   },

   desaturate: function(ratio) {
      this.values.hsl[1] -= this.values.hsl[1] * ratio;
      this.setValues("hsl", this.values.hsl);
      return this;         
   },    

   greyscale: function() {
      var rgb = this.values.rgb;
      // http://en.wikipedia.org/wiki/Grayscale#Converting_color_to_grayscale
      var val = rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11;
      this.setValues("rgb", [val, val, val]);
      return this;
   },

   clearer: function(ratio) {
      this.setValues("alpha", this.values.alpha - (this.values.alpha * ratio));
      return this;
   },

   opaquer: function(ratio) {
      this.setValues("alpha", this.values.alpha + (this.values.alpha * ratio));
      return this;
   },

   rotate: function(degrees) {
      var hue = this.values.hsl[0];
      hue = (hue + degrees) % 360;
      hue = hue < 0 ? 360 + hue : hue;
      this.values.hsl[0] = hue;
      this.setValues("hsl", this.values.hsl);
      return this;
   },
   
   mix: function(color2, weight) {
      weight = 1 - (weight || 0.5);
      
      // algorithm from Sass's mix(). Ratio of first color in mix is
      // determined by the alphas of both colors and the weight
      var t1 = weight * 2 - 1,
          d = this.alpha() - color2.alpha();

      var weight1 = (((t1 * d == -1) ? t1 : (t1 + d) / (1 + t1 * d)) + 1) / 2;
      var weight2 = 1 - weight1;
      
      var rgb = this.rgbArray();
      var rgb2 = color2.rgbArray();

      for (var i = 0; i < rgb.length; i++) {
         rgb[i] = rgb[i] * weight1 + rgb2[i] * weight2;
      }
      this.setValues("rgb", rgb);
      
      var alpha = this.alpha() * weight + color2.alpha() * (1 - weight);
      this.setValues("alpha", alpha);
      
      return this;
   },

   toJSON: function() {
     return this.rgb();
   }
}


Color.prototype.getValues = function(space) {
   var vals = {};
   for (var i = 0; i < space.length; i++) {
      vals[space[i]] = this.values[space][i];
   }
   if (this.values.alpha != 1) {
      vals["a"] = this.values.alpha;
   }
   // {r: 255, g: 255, b: 255, a: 0.4}
   return vals;
}
    
Color.prototype.setValues = function(space, vals) {
   var spaces = {
      "rgb": ["red", "green", "blue"],
      "hsl": ["hue", "saturation", "lightness"],
      "hsv": ["hue", "saturation", "value"],
      "cmyk": ["cyan", "magenta", "yellow", "black"]
   };
   
   var maxes = {
      "rgb": [255, 255, 255],
      "hsl": [360, 100, 100],
      "hsv": [360, 100, 100],
      "cmyk": [100, 100, 100, 100],
   };
   
   var alpha = 1;
   if (space == "alpha") {
      alpha = vals;
   }
   else if (vals.length) {
      // [10, 10, 10]
      this.values[space] = vals.slice(0, space.length);
      alpha = vals[space.length];
   }
   else if (vals[space[0]] !== undefined) {
      // {r: 10, g: 10, b: 10}
      for (var i = 0; i < space.length; i++) {
        this.values[space][i] = vals[space[i]];
      }
      alpha = vals.a;
   }
   else if (vals[spaces[space][0]] !== undefined) {
      // {red: 10, green: 10, blue: 10}
      var chans = spaces[space];
      for (var i = 0; i < space.length; i++) {
        this.values[space][i] = vals[chans[i]];
      }
      alpha = vals.alpha;
   }
   this.values.alpha = Math.max(0, Math.min(1, alpha || this.values.alpha));
   if (space == "alpha") {
      return;
   }

   // convert to all the other color spaces
   for (var sname in spaces) {
      if (sname != space) {
         this.values[sname] = convert[space][sname](this.values[space])
      }
      
      // cap values
      for (var i = 0; i < sname.length; i++) {
         var capped = Math.max(0, Math.min(maxes[sname][i], this.values[sname][i]));
         this.values[sname][i] = Math.round(capped);
      }
   }
   return true;
}

Color.prototype.setSpace = function(space, args) {
   var vals = args[0];
   if (vals === undefined) {
      // color.rgb()
      return this.getValues(space);
   }
   // color.rgb(10, 10, 10)
   if (typeof vals == "number") {
      vals = Array.prototype.slice.call(args);        
   }
   this.setValues(space, vals);
   return this;
}

Color.prototype.setChannel = function(space, index, val) {
   if (val === undefined) {
      // color.red()
      return this.values[space][index];
   }
   // color.red(100)
   this.values[space][index] = val;
   this.setValues(space, this.values[space]);
   return this;     
}

});

require.define("/node_modules/color/node_modules/color-convert/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {"main":"./index"}
});

require.define("/node_modules/color/node_modules/color-convert/index.js",function(require,module,exports,__dirname,__filename,process){var conversions = require("./conversions");

var exports = {};
module.exports = exports;

for (var func in conversions) {
  // export rgb2hslRaw
  exports[func + "Raw"] =  (function(func) {
    // accept array or plain args
    return function(arg) {
      if (typeof arg == "number")
        arg = Array.prototype.slice.call(arguments);
      return conversions[func](arg);
    }
  })(func);

  var pair = /(\w+)2(\w+)/.exec(func),
      from = pair[1],
      to = pair[2];

  // export rgb2hsl and ["rgb"]["hsl"]
  exports[from] = exports[from] || {};

  exports[from][to] = exports[func] = (function(func) { 
    return function(arg) {
      if (typeof arg == "number")
        arg = Array.prototype.slice.call(arguments);
      
      var val = conversions[func](arg);
      if (typeof val == "string" || val === undefined)
        return val; // keyword

      for (var i = 0; i < val.length; i++)
        val[i] = Math.round(val[i]);
      return val;
    }
  })(func);
}
});

require.define("/node_modules/color/node_modules/color-convert/conversions.js",function(require,module,exports,__dirname,__filename,process){/* MIT license */

module.exports = {
  rgb2hsl: rgb2hsl,
  rgb2hsv: rgb2hsv,
  rgb2cmyk: rgb2cmyk,
  rgb2keyword: rgb2keyword,
  rgb2xyz: rgb2xyz,
  rgb2lab: rgb2lab,

  hsl2rgb: hsl2rgb,
  hsl2hsv: hsl2hsv,
  hsl2cmyk: hsl2cmyk,
  hsl2keyword: hsl2keyword,

  hsv2rgb: hsv2rgb,
  hsv2hsl: hsv2hsl,
  hsv2cmyk: hsv2cmyk,
  hsv2keyword: hsv2keyword,

  cmyk2rgb: cmyk2rgb,
  cmyk2hsl: cmyk2hsl,
  cmyk2hsv: cmyk2hsv,
  cmyk2keyword: cmyk2keyword,
  
  keyword2rgb: keyword2rgb,
  keyword2hsl: keyword2hsl,
  keyword2hsv: keyword2hsv,
  keyword2cmyk: keyword2cmyk,
  
  xyz2rgb: xyz2rgb,
}


function rgb2hsl(rgb) {
  var r = rgb[0]/255,
      g = rgb[1]/255,
      b = rgb[2]/255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      delta = max - min,
      h, s, l;

  if (max == min)
    h = 0;
  else if (r == max) 
    h = (g - b) / delta; 
  else if (g == max)
    h = 2 + (b - r) / delta; 
  else if (b == max)
    h = 4 + (r - g)/ delta;

  h = Math.min(h * 60, 360);

  if (h < 0)
    h += 360;

  l = (min + max) / 2;

  if (max == min)
    s = 0;
  else if (l <= 0.5)
    s = delta / (max + min);
  else
    s = delta / (2 - max - min);

  return [h, s * 100, l * 100];
}

function rgb2hsv(rgb) {
  var r = rgb[0],
      g = rgb[1],
      b = rgb[2],
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      delta = max - min,
      h, s, v;

  if (max == 0)
    s = 0;
  else
    s = (delta/max * 1000)/10;

  if (max == min)
    h = 0;
  else if (r == max) 
    h = (g - b) / delta; 
  else if (g == max)
    h = 2 + (b - r) / delta; 
  else if (b == max)
    h = 4 + (r - g) / delta;

  h = Math.min(h * 60, 360);

  if (h < 0) 
    h += 360;

  v = ((max / 255) * 1000) / 10;

  return [h, s, v];
}

function rgb2cmyk(rgb) {
  var r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255,
      c, m, y, k;
      
  k = Math.min(1 - r, 1 - g, 1 - b);
  c = (1 - r - k) / (1 - k);
  m = (1 - g - k) / (1 - k);
  y = (1 - b - k) / (1 - k);
  return [c * 100, m * 100, y * 100, k * 100];
}

function rgb2keyword(rgb) {
  return reverseKeywords[JSON.stringify(rgb)];
}

function rgb2xyz(rgb) {
  var r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255;

  // assume sRGB
  r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
  g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
  b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);
  
  var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
  var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
  var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

  return [x * 100, y *100, z * 100];
}

function rgb2lab(rgb) {
  var xyz = rgb2xyz(rgb),
        x = xyz[0],
        y = xyz[1],
        z = xyz[2],
        l, a, b;

  x /= 95.047;
  y /= 100;
  z /= 108.883;

  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16 / 116);
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16 / 116);
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16 / 116);

  l = (116 * y) - 16;
  a = 500 * (x - y);
  b = 200 * (y - z);
  
  return [l, a, b];
}


function hsl2rgb(hsl) {
  var h = hsl[0] / 360,
      s = hsl[1] / 100,
      l = hsl[2] / 100,
      t1, t2, t3, rgb, val;

  if (s == 0) {
    val = l * 255;
    return [val, val, val];
  }

  if (l < 0.5)
    t2 = l * (1 + s);
  else
    t2 = l + s - l * s;
  t1 = 2 * l - t2;

  rgb = [0, 0, 0];
  for (var i = 0; i < 3; i++) {
    t3 = h + 1 / 3 * - (i - 1);
    t3 < 0 && t3++;
    t3 > 1 && t3--;

    if (6 * t3 < 1)
      val = t1 + (t2 - t1) * 6 * t3;
    else if (2 * t3 < 1)
      val = t2;
    else if (3 * t3 < 2)
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
    else
      val = t1;

    rgb[i] = val * 255;
  }
  
  return rgb;
}

function hsl2hsv(hsl) {
  var h = hsl[0],
      s = hsl[1] / 100,
      l = hsl[2] / 100,
      sv, v;
  l *= 2;
  s *= (l <= 1) ? l : 2 - l;
  v = (l + s) / 2;
  sv = (2 * s) / (l + s);
  return [h, s * 100, v * 100];
}

function hsl2cmyk(args) {
  return rgb2cmyk(hsl2rgb(args));
}

function hsl2keyword(args) {
  return rgb2keyword(hsl2rgb(args));
}


function hsv2rgb(hsv) {
  var h = hsv[0] / 60,
      s = hsv[1] / 100,
      v = hsv[2] / 100,
      hi = Math.floor(h) % 6;

  var f = h - Math.floor(h),
      p = 255 * v * (1 - s),
      q = 255 * v * (1 - (s * f)),
      t = 255 * v * (1 - (s * (1 - f))),
      v = 255 * v;

  switch(hi) {
    case 0:
      return [v, t, p];
    case 1:
      return [q, v, p];
    case 2:
      return [p, v, t];
    case 3:
      return [p, q, v];
    case 4:
      return [t, p, v];
    case 5:
      return [v, p, q];
  }
}

function hsv2hsl(hsv) {
  var h = hsv[0],
      s = hsv[1] / 100,
      v = hsv[2] / 100,
      sl, l;

  l = (2 - s) * v;  
  sl = s * v;
  sl /= (l <= 1) ? l : 2 - l;
  l /= 2;
  return [h, sl * 100, l * 100];
}

function hsv2cmyk(args) {
  return rgb2cmyk(hsv2rgb(args));
}

function hsv2keyword(args) {
  return rgb2keyword(hsv2rgb(args));
}

function cmyk2rgb(cmyk) {
  var c = cmyk[0] / 100,
      m = cmyk[1] / 100,
      y = cmyk[2] / 100,
      k = cmyk[3] / 100,
      r, g, b;

  r = 1 - Math.min(1, c * (1 - k) + k);
  g = 1 - Math.min(1, m * (1 - k) + k);
  b = 1 - Math.min(1, y * (1 - k) + k);
  return [r * 255, g * 255, b * 255];
}

function cmyk2hsl(args) {
  return rgb2hsl(cmyk2rgb(args));
}

function cmyk2hsv(args) {
  return rgb2hsv(cmyk2rgb(args));
}

function cmyk2keyword(args) {
  return rgb2keyword(cmyk2rgb(args));
}


function xyz2rgb(xyz) {
  var x = xyz[0] / 100,
      y = xyz[1] / 100,
      z = xyz[2] / 100,
      r, g, b;

  r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
  g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
  b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

  // assume sRGB
  r = r > 0.0031308 ? ((1.055 * Math.pow(r, 1.0 / 2.4)) - 0.055)
    : r = (r * 12.92);

  g = g > 0.0031308 ? ((1.055 * Math.pow(g, 1.0 / 2.4)) - 0.055)
    : g = (g * 12.92);
        
  b = b > 0.0031308 ? ((1.055 * Math.pow(b, 1.0 / 2.4)) - 0.055)
    : b = (b * 12.92);

  r = (r < 0) ? 0 : r;
  g = (g < 0) ? 0 : g;
  b = (b < 0) ? 0 : b;

  return [r * 255, g * 255, b * 255];
}


function keyword2rgb(keyword) {
  return cssKeywords[keyword];
}

function keyword2hsl(args) {
  return rgb2hsl(keyword2rgb(args));
}

function keyword2hsv(args) {
  return rgb2hsv(keyword2rgb(args));
}

function keyword2cmyk(args) {
  return rgb2cmyk(keyword2rgb(args));
}

var cssKeywords = {
  aliceblue:  [240,248,255],
  antiquewhite: [250,235,215],
  aqua: [0,255,255],
  aquamarine: [127,255,212],
  azure:  [240,255,255],
  beige:  [245,245,220],
  bisque: [255,228,196],
  black:  [0,0,0],
  blanchedalmond: [255,235,205],
  blue: [0,0,255],
  blueviolet: [138,43,226],
  brown:  [165,42,42],
  burlywood:  [222,184,135],
  cadetblue:  [95,158,160],
  chartreuse: [127,255,0],
  chocolate:  [210,105,30],
  coral:  [255,127,80],
  cornflowerblue: [100,149,237],
  cornsilk: [255,248,220],
  crimson:  [220,20,60],
  cyan: [0,255,255],
  darkblue: [0,0,139],
  darkcyan: [0,139,139],
  darkgoldenrod:  [184,134,11],
  darkgray: [169,169,169],
  darkgreen:  [0,100,0],
  darkgrey: [169,169,169],
  darkkhaki:  [189,183,107],
  darkmagenta:  [139,0,139],
  darkolivegreen: [85,107,47],
  darkorange: [255,140,0],
  darkorchid: [153,50,204],
  darkred:  [139,0,0],
  darksalmon: [233,150,122],
  darkseagreen: [143,188,143],
  darkslateblue:  [72,61,139],
  darkslategray:  [47,79,79],
  darkslategrey:  [47,79,79],
  darkturquoise:  [0,206,209],
  darkviolet: [148,0,211],
  deeppink: [255,20,147],
  deepskyblue:  [0,191,255],
  dimgray:  [105,105,105],
  dimgrey:  [105,105,105],
  dodgerblue: [30,144,255],
  firebrick:  [178,34,34],
  floralwhite:  [255,250,240],
  forestgreen:  [34,139,34],
  fuchsia:  [255,0,255],
  gainsboro:  [220,220,220],
  ghostwhite: [248,248,255],
  gold: [255,215,0],
  goldenrod:  [218,165,32],
  gray: [128,128,128],
  green:  [0,128,0],
  greenyellow:  [173,255,47],
  grey: [128,128,128],
  honeydew: [240,255,240],
  hotpink:  [255,105,180],
  indianred:  [205,92,92],
  indigo: [75,0,130],
  ivory:  [255,255,240],
  khaki:  [240,230,140],
  lavender: [230,230,250],
  lavenderblush:  [255,240,245],
  lawngreen:  [124,252,0],
  lemonchiffon: [255,250,205],
  lightblue:  [173,216,230],
  lightcoral: [240,128,128],
  lightcyan:  [224,255,255],
  lightgoldenrodyellow: [250,250,210],
  lightgray:  [211,211,211],
  lightgreen: [144,238,144],
  lightgrey:  [211,211,211],
  lightpink:  [255,182,193],
  lightsalmon:  [255,160,122],
  lightseagreen:  [32,178,170],
  lightskyblue: [135,206,250],
  lightslategray: [119,136,153],
  lightslategrey: [119,136,153],
  lightsteelblue: [176,196,222],
  lightyellow:  [255,255,224],
  lime: [0,255,0],
  limegreen:  [50,205,50],
  linen:  [250,240,230],
  magenta:  [255,0,255],
  maroon: [128,0,0],
  mediumaquamarine: [102,205,170],
  mediumblue: [0,0,205],
  mediumorchid: [186,85,211],
  mediumpurple: [147,112,219],
  mediumseagreen: [60,179,113],
  mediumslateblue:  [123,104,238],
  mediumspringgreen:  [0,250,154],
  mediumturquoise:  [72,209,204],
  mediumvioletred:  [199,21,133],
  midnightblue: [25,25,112],
  mintcream:  [245,255,250],
  mistyrose:  [255,228,225],
  moccasin: [255,228,181],
  navajowhite:  [255,222,173],
  navy: [0,0,128],
  oldlace:  [253,245,230],
  olive:  [128,128,0],
  olivedrab:  [107,142,35],
  orange: [255,165,0],
  orangered:  [255,69,0],
  orchid: [218,112,214],
  palegoldenrod:  [238,232,170],
  palegreen:  [152,251,152],
  paleturquoise:  [175,238,238],
  palevioletred:  [219,112,147],
  papayawhip: [255,239,213],
  peachpuff:  [255,218,185],
  peru: [205,133,63],
  pink: [255,192,203],
  plum: [221,160,221],
  powderblue: [176,224,230],
  purple: [128,0,128],
  red:  [255,0,0],
  rosybrown:  [188,143,143],
  royalblue:  [65,105,225],
  saddlebrown:  [139,69,19],
  salmon: [250,128,114],
  sandybrown: [244,164,96],
  seagreen: [46,139,87],
  seashell: [255,245,238],
  sienna: [160,82,45],
  silver: [192,192,192],
  skyblue:  [135,206,235],
  slateblue:  [106,90,205],
  slategray:  [112,128,144],
  slategrey:  [112,128,144],
  snow: [255,250,250],
  springgreen:  [0,255,127],
  steelblue:  [70,130,180],
  tan:  [210,180,140],
  teal: [0,128,128],
  thistle:  [216,191,216],
  tomato: [255,99,71],
  turquoise:  [64,224,208],
  violet: [238,130,238],
  wheat:  [245,222,179],
  white:  [255,255,255],
  whitesmoke: [245,245,245],
  yellow: [255,255,0],
  yellowgreen:  [154,205,50]
};

var reverseKeywords = {};
for (var key in cssKeywords) {
  reverseKeywords[JSON.stringify(cssKeywords[key])] = key;
}

});

require.define("/node_modules/color/node_modules/color-string/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {"main":"./color-string"}
});

require.define("/node_modules/color/node_modules/color-string/color-string.js",function(require,module,exports,__dirname,__filename,process){/* MIT license */
var convert = require("color-convert");

module.exports = {
   getRgba: getRgba,
   getHsla: getHsla,
   getRgb: getRgb,
   getHsl: getHsl,
   getAlpha: getAlpha,
   
   hexString: hexString,
   rgbString: rgbString,
   rgbaString: rgbaString,
   percentString: percentString,
   percentaString: percentaString,
   hslString: hslString,
   hslaString: hslaString,
   keyword: keyword
}

function getRgba(string) {
   if (!string) {
      return;
   }
   var abbr =  /^#([a-fA-F0-9]{3})$/,
       hex =  /^#([a-fA-F0-9]{6})$/,
       rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d\.]+)\s*)?\)$/,
       per = /^rgba?\(\s*([\d\.]+)\%\s*,\s*([\d\.]+)\%\s*,\s*([\d\.]+)\%\s*(?:,\s*([\d\.]+)\s*)?\)$/,
       keyword = /(\D+)/;
       
   var rgb = [0, 0, 0],
       a = 1,
       match = string.match(abbr);
   if (match) {
      match = match[1];
      for (var i = 0; i < rgb.length; i++) {
         rgb[i] = parseInt(match[i] + match[i], 16);
      }
   }
   else if (match = string.match(hex)) {
      match = match[1];
      for (var i = 0; i < rgb.length; i++) {
         rgb[i] = parseInt(match.slice(i * 2, i * 2 + 2), 16);
      }
   }
   else if (match = string.match(rgba)) {
      for (var i = 0; i < rgb.length; i++) {
         rgb[i] = parseInt(match[i + 1]);
      }
      a = parseFloat(match[4]);
   }
   else if (match = string.match(per)) {
      for (var i = 0; i < rgb.length; i++) {
         rgb[i] = Math.round(parseFloat(match[i + 1]) * 2.55);
      }
      a = parseFloat(match[4]);
   }
   else if (match = string.match(keyword)) {
      if (match[1] == "transparent") {
         return [0, 0, 0, 0];
      }
      rgb = convert.keyword2rgb(match[1]);
      if (!rgb) {
         return;
      }
   }
   
   for (var i = 0; i < rgb.length; i++) {
      rgb[i] = scale(rgb[i], 0, 255);
   }
   if (!a) {
      a = 1;
   }
   else {
      a = scale(a, 0, 1);
   }
   rgb.push(a);
   return rgb;
}

function getHsla(string) {
   if (!string) {
      return;
   }
   var hsl = /^hsla?\(\s*(\d+)\s*,\s*([\d\.]+)%\s*,\s*([\d\.]+)%\s*(?:,\s*([\d\.]+)\s*)?\)/;
   var match = string.match(hsl);
   if (match) {
      var h = scale(parseInt(match[1]), 0, 360),
          s = scale(parseFloat(match[2]), 0, 100),
          l = scale(parseFloat(match[3]), 0, 100),
          a = scale(parseFloat(match[4]) || 1, 0, 1);
      return [h, s, l, a];
   }
}

function getRgb(string) {
   return getRgba(string).slice(0, 3);
}

function getHsl(string) {
   return getHsla(string).slice(0, 3);
}

function getAlpha(string) {
   var vals = getRgba(string);
   if (vals) {
      return vals[3];
   }
   else if (vals = getHsla(string)) {
      return vals[3];
   }
}

// generators
function hexString(rgb) {
   return "#" + hexDouble(rgb[0]) + hexDouble(rgb[1])
              + hexDouble(rgb[2]);
}

function rgbString(rgba, alpha) {
   if (alpha < 1 || (rgba[3] && rgba[3] < 1)) {
      return rgbaString(rgba, alpha);
   }
   return "rgb(" + rgba[0] + ", " + rgba[1] + ", " + rgba[2] + ")";
}

function rgbaString(rgba, alpha) {
   return "rgba(" + rgba[0] + ", " + rgba[1] + ", " + rgba[2]
           + ", " + (alpha || rgba[3] || 1) + ")";
}

function percentString(rgba, alpha) {
   if (alpha < 1 || (rgba[3] && rgba[3] < 1)) {
      return percentaString(rgba, alpha);
   } 
   var r = Math.round(rgba[0]/255 * 100),
       g = Math.round(rgba[1]/255 * 100),
       b = Math.round(rgba[2]/255 * 100);

   return "rgb(" + r + "%, " + g + "%, " + b + "%)"; 
}

function percentaString(rgba, alpha) {
   var r = Math.round(rgba[0]/255 * 100),
       g = Math.round(rgba[1]/255 * 100),
       b = Math.round(rgba[2]/255 * 100);
   return "rgba(" + r + "%, " + g + "%, " + b + "%, " + (alpha || rgba[3] || 1) + ")";
}

function hslString(hsla, alpha) {
   if (alpha < 1 || (hsla[3] && hsla[3] < 1)) {
      return hslaString(hsla, alpha);
   }
   return "hsl(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%)";
}

function hslaString(hsla, alpha) {
   return "hsla(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%, "
           + (alpha || hsla[3] || 1) + ")";   
}

function keyword(rgb) {
   return convert.rgb2keyword(rgb.slice(0, 3));
}

// helpers
function scale(num, min, max) {
   return Math.min(Math.max(min, num), max);
}

function hexDouble(num) {
  var str = num.toString(16).toUpperCase();
  return (str.length < 2) ? "0" + str : str;
}

});

require.define("/app/vendor/js/spectrum.js",function(require,module,exports,__dirname,__filename,process){// Spectrum: The No Hassle Colorpicker
// https://github.com/bgrins/spectrum
// Author: Brian Grinstead
// License: MIT
// Requires: jQuery, spectrum.css
(function (window, $, undefined) {
  var defaultOpts = {
    // Events
    beforeShow: noop,
    move: noop,
    change: noop,
    show: noop,
    hide: noop,
    // Options
    color: false,
    flat: false,
    showInput: false,
    showButtons: true,
    showInitial: false,
    showPalette: false,
    showPaletteOnly: false,
    showSelectionPalette: true,
    localStorageKey: false,
    maxSelectionSize: 7,
    cancelText: "cancel",
    chooseText: "choose",
    preferredFormat: false,
    className: "",
    theme: "sp-light",
    palette: ['fff', '000'],
    selectionPalette: []
  },
    spectrums = [],
    IE = $.browser.msie,
    replaceInput = ["<div class='sp-replacer'>", "<div class='sp-preview'></div>", "<div class='sp-dd'>&#9660;</div>", "</div>"].join(''),
    markup = (function () {
      // IE does not support gradients with multiple stops, so we need to simulate            
      //  that for the rainbow slider with 8 divs that each have a single gradient
      var gradientFix = "";
      if (IE) {
        for (var i = 1; i <= 6; i++) {
          gradientFix += "<div class='sp-" + i + "'></div>";
        }
      }
      return ["<div class='sp-container'>", "<div class='sp-palette-container'>", "<div class='sp-palette sp-thumb sp-cf'></div>", "</div>", "<div class='sp-picker-container'>", "<div class='sp-top sp-cf'>", "<div class='sp-fill'></div>", "<div class='sp-top-inner'>", "<div class='sp-color'>", "<div class='sp-sat'>", "<div class='sp-val'>", "<div class='sp-dragger'></div>", "</div>", "</div>", "</div>", "<div class='sp-hue'>", "<div class='sp-slider'></div>", gradientFix, "</div>", "</div>", "</div>", "<div class='sp-input-container sp-cf'>", "<input class='sp-input' type='text' spellcheck='false'  />", "</div>", "<div class='sp-initial sp-thumb sp-cf'></div>", "<div class='sp-button-container sp-cf'>", "<a class='sp-cancel' href='#'></a>", "<button class='sp-choose'></button>", "</div>", "</div>", "</div>"].join("");
    })(),
    paletteTemplate = function (p, color, className) {
      var html = [];
      for (var i = 0; i < p.length; i++) {
        var tiny = tinycolor(p[i]);
        var c = tiny.toHsl().l < .5 ? "sp-thumb-dark" : "sp-thumb-light";
        c += (tinycolor.equals(color, p[i])) ? " sp-thumb-active" : "";
        html.push('<span title="' + tiny.toHexString() + '" data-color="' + tiny.toHexString() + '" style="background-color:' + tiny.toRgbString() + ';" class="' + c + '"></span>');
      }
      return "<div class='sp-cf " + className + "'>" + html.join('') + "</div>";
    };

  function hideAll() {
    for (var i = 0; i < spectrums.length; i++) {
      if (spectrums[i]) {
        spectrums[i].hide();
      }
    }
  }

  function instanceOptions(o, callbackContext) {
    var opts = $.extend({}, defaultOpts, o);
    opts.callbacks = {
      'move': bind(opts.move, callbackContext),
      'change': bind(opts.change, callbackContext),
      'show': bind(opts.show, callbackContext),
      'hide': bind(opts.hide, callbackContext),
      'beforeShow': bind(opts.beforeShow, callbackContext)
    };
    return opts;
  }

  function spectrum(element, o) {
    var opts = instanceOptions(o, element),
      flat = opts.flat,
      showPaletteOnly = opts.showPaletteOnly,
      showPalette = opts.showPalette || showPaletteOnly,
      showInitial = opts.showInitial && !flat,
      showInput = opts.showInput,
      showSelectionPalette = opts.showSelectionPalette,
      localStorageKey = opts.localStorageKey,
      theme = opts.theme,
      callbacks = opts.callbacks,
      resize = throttle(reflow, 10),
      visible = false,
      dragWidth = 0,
      dragHeight = 0,
      dragHelperHeight = 0,
      slideHeight = 0,
      slideWidth = 0,
      slideHelperHeight = 0,
      currentHue = 0,
      currentSaturation = 0,
      currentValue = 0,
      palette = opts.palette.slice(0),
      paletteArray = $.isArray(palette[0]) ? palette : [palette],
      selectionPalette = opts.selectionPalette.slice(0),
      draggingClass = "sp-dragging";
    var doc = element.ownerDocument,
      body = doc.body,
      boundElement = $(element),
      container = $(markup, doc).addClass(theme),
      dragger = container.find(".sp-color"),
      dragHelper = container.find(".sp-dragger"),
      slider = container.find(".sp-hue"),
      slideHelper = container.find(".sp-slider"),
      textInput = container.find(".sp-input"),
      paletteContainer = container.find(".sp-palette"),
      initialColorContainer = container.find(".sp-initial"),
      cancelButton = container.find(".sp-cancel"),
      chooseButton = container.find(".sp-choose"),
      isInput = boundElement.is("input"),
      shouldReplace = isInput && !flat,
      replacer = (shouldReplace) ? $(replaceInput).addClass(theme) : $([]),
      offsetElement = (shouldReplace) ? replacer : boundElement,
      previewElement = replacer.find(".sp-preview"),
      initialColor = opts.color || (isInput && boundElement.val()),
      colorOnShow = false,
      preferredFormat = opts.preferredFormat,
      currentPreferredFormat = preferredFormat,
      clickoutFiresChange = !opts.showButtons;
    chooseButton.text(opts.chooseText);
    cancelButton.text(opts.cancelText);

    function initialize() {
      if (IE) {
        container.find("*:not(input)").attr("unselectable", "on");
      }
      container.toggleClass("sp-flat", flat);
      container.toggleClass("sp-input-disabled", !showInput);
      container.toggleClass("sp-buttons-disabled", !opts.showButtons || flat);
      container.toggleClass("sp-palette-disabled", !showPalette);
      container.toggleClass("sp-palette-only", showPaletteOnly);
      container.toggleClass("sp-initial-disabled", !showInitial);
      container.addClass(opts.className);
      if (shouldReplace) {
        boundElement.hide().after(replacer);
      }
      if (flat) {
        boundElement.after(container).hide();
      } else {
        $(body).append(container.hide());
      }
      if (localStorageKey && window.localStorage) {
        try {
          selectionPalette = window.localStorage[localStorageKey].split(",");
        } catch (e) {}
      }
      offsetElement.bind("click.spectrum touchstart.spectrum", function (e) {
        toggle();
        e.stopPropagation();
        if (!$(e.target).is("input")) {
          e.preventDefault();
        }
      });
      // Prevent clicks from bubbling up to document.  This would cause it to be hidden.
      container.click(stopPropagation);
      // Handle user typed input
      textInput.change(setFromTextInput);
      textInput.bind("paste", function () {
        setTimeout(setFromTextInput, 1);
      });
      textInput.keydown(function (e) {
        if (e.keyCode == 13) {
          setFromTextInput();
        }
      });
      cancelButton.bind("click.spectrum", function (e) {
        e.stopPropagation();
        e.preventDefault();
        hide();
      });
      chooseButton.bind("click.spectrum", function (e) {
        e.stopPropagation();
        e.preventDefault();
        if (isValid()) {
          updateOriginalInput(true);
          hide();
        }
      });
      draggable(slider, function (dragX, dragY) {
        currentHue = (dragY / slideHeight);
        move();
      }, dragStart, dragStop);
      draggable(dragger, function (dragX, dragY) {
        currentSaturation = dragX / dragWidth;
        currentValue = (dragHeight - dragY) / dragHeight;
        move();
      }, dragStart, dragStop);
      if ( !! initialColor) {
        set(initialColor);
        // In case color was black - update the preview UI and set the format 
        // since the set function will not run (default color is black).
        updateUI();
        currentPreferredFormat = preferredFormat || tinycolor(initialColor).format;
        addColorToSelectionPalette(initialColor);
      } else {
        updateUI();
      }
      if (flat) {
        show();
      }

      function palletElementClick(e) {
        if (e.data && e.data.ignore) {
          set($(this).data("color"));
          move();
        } else {
          set($(this).data("color"));
          updateOriginalInput(true);
          move();
          hide();
        }
        return false;
      }
      var paletteEvent = IE ? "mousedown.spectrum" : "click.spectrum touchstart.spectrum";
      paletteContainer.delegate("span", paletteEvent, palletElementClick);
      initialColorContainer.delegate("span::nth-child(1)", paletteEvent, {
        ignore: true
      }, palletElementClick);
    }

    function addColorToSelectionPalette(color) {
      if (showSelectionPalette) {
        selectionPalette.push(tinycolor(color).toHexString());
        if (localStorageKey && window.localStorage) {
          window.localStorage[localStorageKey] = selectionPalette.join(",");
        }
      }
    }

    function getUniqueSelectionPalette() {
      var unique = [];
      var p = selectionPalette;
      var paletteLookup = {};
      if (showPalette) {
        for (var i = 0; i < paletteArray.length; i++) {
          for (var j = 0; j < paletteArray[i].length; j++) {
            var hex = tinycolor(paletteArray[i][j]).toHexString();
            paletteLookup[hex] = true;
          }
        }
        for (var i = 0; i < p.length; i++) {
          var color = tinycolor(p[i]);
          var hex = color.toHexString();
          if (!paletteLookup.hasOwnProperty(hex)) {
            unique.push(p[i]);
            paletteLookup[hex] = true;
          }
        }
      }
      return unique.reverse().slice(0, opts.maxSelectionSize);
    }

    function drawPalette() {
      var currentColor = get();
      var html = $.map(paletteArray, function (palette, i) {
        return paletteTemplate(palette, currentColor, "sp-palette-row sp-palette-row-" + i);
      });
      if (selectionPalette) {
        html.push(paletteTemplate(getUniqueSelectionPalette(), currentColor, "sp-palette-row sp-palette-row-selection"));
      }
      paletteContainer.html(html.join(""));
    }

    function drawInitial() {
      if (showInitial) {
        var initial = colorOnShow;
        var current = get();
        initialColorContainer.html(paletteTemplate([initial, current], current, "sp-palette-row-initial"));
      }
    }

    function dragStart() {
      if (dragHeight === 0 || dragWidth === 0 || slideHeight === 0) {
        reflow();
      }
      container.addClass(draggingClass);
    }

    function dragStop() {
      container.removeClass(draggingClass);
    }

    function setFromTextInput() {
      var tiny = tinycolor(textInput.val());
      if (tiny.ok) {
        set(tiny);
      } else {
        textInput.addClass("sp-validation-error");
      }
    }

    function toggle() {
      (visible) ? hide() : show();
    }

    function show() {
      if (visible) {
        reflow();
        return;
      }
      if (callbacks.beforeShow(get()) === false) return;
      hideAll();
      visible = true;
      $(doc).bind("click.spectrum", hide);
      $(window).bind("resize.spectrum", resize);
      replacer.addClass("sp-active");
      container.show();
      if (showPalette) {
        drawPalette();
      }
      reflow();
      updateUI();
      colorOnShow = get();
      drawInitial();
      callbacks.show(colorOnShow);
    }

    function hide() {
      if (!visible || flat) {
        return;
      }
      visible = false;
      $(doc).unbind("click.spectrum", hide);
      $(window).unbind("resize.spectrum", resize);
      replacer.removeClass("sp-active");
      container.hide();
      var colorHasChanged = !tinycolor.equals(get(), colorOnShow);
      if (colorHasChanged) {
        if (clickoutFiresChange) {
          updateOriginalInput(true);
        } else {
          revert();
        }
      }
      callbacks.hide(get());
    }

    function revert() {
      set(colorOnShow, true);
    }

    function set(color, ignoreFormatChange) {
      if (tinycolor.equals(color, get())) {
        return;
      }
      var newColor = tinycolor(color);
      var newHsv = newColor.toHsv();
      currentHue = newHsv.h;
      currentSaturation = newHsv.s;
      currentValue = newHsv.v;
      updateUI();
      if (!ignoreFormatChange) {
        currentPreferredFormat = preferredFormat || newColor.format;
      }
    }

    function get() {
      return tinycolor.fromRatio({
        h: currentHue,
        s: currentSaturation,
        v: currentValue
      });
    }

    function isValid() {
      return !textInput.hasClass("sp-validation-error");
    }

    function move() {
      updateUI();
      callbacks.move(get());
    }

    function updateUI() {
      textInput.removeClass("sp-validation-error");
      updateHelperLocations();
      // Update dragger background color (gradients take care of saturation and value).
      var flatColor = tinycolor({
        h: currentHue,
        s: "1.0",
        v: "1.0"
      });
      dragger.css("background-color", flatColor.toHexString());
      var realColor = get(),
        realHex = realColor.toHexString();
      // Update the replaced elements background color (with actual selected color)
      previewElement.css("background-color", realHex);
      // Update the text entry input as it changes happen
      if (showInput) {
        textInput.val(realColor.toString(currentPreferredFormat));
      }
      if (showPalette) {
        drawPalette();
      }
      drawInitial();
    }

    function updateHelperLocations() {
      var h = currentHue;
      var s = currentSaturation;
      var v = currentValue;
      // Where to show the little circle in that displays your current selected color
      var dragX = s * dragWidth;
      var dragY = dragHeight - (v * dragHeight);
      dragX = Math.max(-dragHelperHeight, Math.min(dragWidth - dragHelperHeight, dragX - dragHelperHeight));
      dragY = Math.max(-dragHelperHeight, Math.min(dragHeight - dragHelperHeight, dragY - dragHelperHeight));
      dragHelper.css({
        "top": dragY,
        "left": dragX
      });
      // Where to show the bar that displays your current selected hue
      var slideY = (currentHue) * slideHeight;
      slideHelper.css({
        "top": slideY - slideHelperHeight
      });
    }

    function updateOriginalInput(fireCallback) {
      var color = get();
      if (isInput) {
        boundElement.val(color.toString(currentPreferredFormat)).change();
      }
      var hasChanged = !tinycolor.equals(color, colorOnShow);
      colorOnShow = color;
      // Update the selection palette with the current color
      addColorToSelectionPalette(color);
      if (fireCallback && hasChanged) {
        callbacks.change(color);
      }
    }

    function reflow() {
      dragWidth = dragger.width();
      dragHeight = dragger.height();
      dragHelperHeight = dragHelper.height();
      slideWidth = slider.width();
      slideHeight = slider.height();
      slideHelperHeight = slideHelper.height();
      if (!flat) {
        container.offset(getOffset(container, offsetElement));
      }
      updateHelperLocations();
    }

    function destroy() {
      boundElement.show();
      offsetElement.unbind("click.spectrum touchstart.spectrum");
      container.remove();
      replacer.remove();
      spectrums[spect.id] = null;
    }
    initialize();
    var spect = {
      show: show,
      hide: hide,
      set: function (c) {
        set(c);
        updateOriginalInput();
      },
      get: get,
      destroy: destroy,
      container: container
    };
    spect.id = spectrums.push(spect) - 1;
    return spect;
  }
  /**
   * checkOffset - get the offset below/above and left/right element depending on screen position
   * Thanks https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.datepicker.js
   */

  function getOffset(picker, input) {
    var extraY = 0;
    var dpWidth = picker.outerWidth();
    var dpHeight = picker.outerHeight();
    var inputWidth = input.outerWidth();
    var inputHeight = input.outerHeight();
    var doc = picker[0].ownerDocument;
    var docElem = doc.documentElement;
    var viewWidth = docElem.clientWidth + $(doc).scrollLeft();
    var viewHeight = docElem.clientHeight + $(doc).scrollTop();
    var offset = input.offset();
    offset.top += inputHeight;
    offset.left -= Math.min(offset.left, (offset.left + dpWidth > viewWidth && viewWidth > dpWidth) ? Math.abs(offset.left + dpWidth - viewWidth) : 0);
    offset.top -= Math.min(offset.top, ((offset.top + dpHeight > viewHeight && viewHeight > dpHeight) ? Math.abs(dpHeight + inputHeight - extraY) : extraY));
    return offset;
  }
  /** 
   * noop - do nothing
   */

  function noop() {}
  /**
   * stopPropagation - makes the code only doing this a little easier to read in line
   */

  function stopPropagation(e) {
    e.stopPropagation();
  }
  /**
   * Create a function bound to a given object
   * Thanks to underscore.js
   */

  function bind(func, obj) {
    var slice = Array.prototype.slice;
    var args = slice.call(arguments, 2);
    return function () {
      return func.apply(obj, args.concat(slice.call(arguments)));
    }
  }
  /**
   * Lightweight drag helper.  Handles containment within the element, so that
   * when dragging, the x is within [0,element.width] and y is within [0,element.height]
   */

  function draggable(element, onmove, onstart, onstop) {
    onmove = onmove ||
    function () {};
    onstart = onstart ||
    function () {};
    onstop = onstop ||
    function () {};
    var doc = element.ownerDocument || document;
    var dragging = false;
    var offset = {};
    var maxHeight = 0;
    var maxWidth = 0;
    var IE = $.browser.msie;
    var hasTouch = ('ontouchstart' in window);
    var duringDragEvents = {};
    duringDragEvents["selectstart"] = prevent;
    duringDragEvents["dragstart"] = prevent;
    duringDragEvents[(hasTouch ? "touchmove" : "mousemove")] = move;
    duringDragEvents[(hasTouch ? "touchend" : "mouseup")] = stop;

    function prevent(e) {
      if (e.stopPropagation) {
        e.stopPropagation();
      }
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.returnValue = false;
    }

    function move(e) {
      if (dragging) {
        // Mouseup happened outside of window
        if (IE && !(document.documentMode >= 9) && !e.button) {
          return stop();
        }
        var touches = e.originalEvent.touches;
        var pageX = touches ? touches[0].pageX : e.pageX;
        var pageY = touches ? touches[0].pageY : e.pageY;
        var dragX = Math.max(0, Math.min(pageX - offset.left, maxWidth));
        var dragY = Math.max(0, Math.min(pageY - offset.top, maxHeight));
        if (hasTouch) {
          // Stop scrolling in iOS
          prevent(e);
        }
        onmove.apply(element, [dragX, dragY]);
      }
    }

    function start(e) {
      var rightclick = (e.which) ? (e.which == 3) : (e.button == 2);
      var touches = e.originalEvent.touches;
      if (!rightclick && !dragging) {
        if (onstart.apply(element, arguments) !== false) {
          dragging = true;
          maxHeight = $(element).height();
          maxWidth = $(element).width();
          offset = $(element).offset();
          $(doc).bind(duringDragEvents);
          $(doc.body).addClass("sp-dragging");
          if (!hasTouch) {
            move(e);
          }
          prevent(e);
        }
      }
    }

    function stop() {
      if (dragging) {
        $(doc).unbind(duringDragEvents);
        $(doc.body).removeClass("sp-dragging");
        onstop.apply(element, arguments);
      }
      dragging = false;
    }
    $(element).bind(hasTouch ? "touchstart" : "mousedown", start);
  }

  function throttle(func, wait, debounce) {
    var timeout;
    return function () {
      var context = this,
        args = arguments;
      var throttler = function () {
          timeout = null;
          func.apply(context, args);
        };
      if (debounce) clearTimeout(timeout);
      if (debounce || !timeout) timeout = setTimeout(throttler, wait);
    };
  }
  /**
   * Define a jQuery plugin
   */
  var dataID = "spectrum.id";
  $.fn.spectrum = function (opts, extra) {
    if (typeof opts == "string") {
      if (opts == "get") {
        return spectrums[this.eq(0).data(dataID)].get();
      } else if (opts == "container") {
        return spectrums[$(this).data(dataID)].container;
      }
      return this.each(function () {
        var spect = spectrums[$(this).data(dataID)];
        if (spect) {
          if (opts == "show") {
            spect.show();
          }
          if (opts == "hide") {
            spect.hide();
          }
          if (opts == "set") {
            spect.set(extra);
          }
          if (opts == "destroy") {
            spect.destroy();
            $(this).removeData(dataID);
          }
        }
      });
    }
    // Initializing a new one
    return this.spectrum("destroy").each(function () {
      var spect = spectrum(this, opts);
      $(this).data(dataID, spect.id);
    });
  };
  $.fn.spectrum.load = true;
  $.fn.spectrum.loadOpts = {};
  $.fn.spectrum.draggable = draggable;
  $.fn.spectrum.processNativeColorInputs = function () {
    var supportsColor = $("<input type='color' />")[0].type === "color";
    if (!supportsColor) {
      $("input[type=color]").spectrum({
        preferredFormat: "hex6"
      });
    }
  };
  $(function () {
    if ($.fn.spectrum.load) {
      $.fn.spectrum.processNativeColorInputs();
    }
  });
})(this, jQuery);
// TinyColor.js - <https://github.com/bgrins/TinyColor> - 2011 Brian Grinstead - v0.5
(function (window) {
  var trimLeft = /^[\s,#]+/,
    trimRight = /\s+$/,
    tinyCounter = 0,
    math = Math,
    mathRound = math.round,
    mathMin = math.min,
    mathMax = math.max,
    mathRandom = math.random,
    parseFloat = window.parseFloat;

  function tinycolor(color, opts) {
    // If input is already a tinycolor, return itself
    if (typeof color == "object" && color.hasOwnProperty("_tc_id")) {
      return color;
    }
    var rgb = inputToRGB(color);
    var r = rgb.r,
      g = rgb.g,
      b = rgb.b,
      a = parseFloat(rgb.a),
      format = rgb.format;
    return {
      ok: rgb.ok,
      format: format,
      _tc_id: tinyCounter++,
      alpha: a,
      toHsv: function () {
        var hsv = rgbToHsv(r, g, b);
        return {
          h: hsv.h,
          s: hsv.s,
          v: hsv.v,
          a: a
        };
      },
      toHsvString: function () {
        var hsv = rgbToHsv(r, g, b);
        var h = mathRound(hsv.h * 360),
          s = mathRound(hsv.s * 100),
          v = mathRound(hsv.v * 100);
        return (a == 1) ? "hsv(" + h + ", " + s + "%, " + v + "%)" : "hsva(" + h + ", " + s + "%, " + v + "%, " + a + ")";
      },
      toHsl: function () {
        var hsl = rgbToHsl(r, g, b);
        return {
          h: hsl.h,
          s: hsl.s,
          l: hsl.l,
          a: a
        };
      },
      toHslString: function () {
        var hsl = rgbToHsl(r, g, b);
        var h = mathRound(hsl.h * 360),
          s = mathRound(hsl.s * 100),
          l = mathRound(hsl.l * 100);
        return (a == 1) ? "hsl(" + h + ", " + s + "%, " + l + "%)" : "hsla(" + h + ", " + s + "%, " + l + "%, " + a + ")";
      },
      toHex: function () {
        return rgbToHex(r, g, b);
      },
      toHexString: function (force6Char) {
        return '#' + rgbToHex(r, g, b, force6Char);
      },
      toRgb: function () {
        return {
          r: mathRound(r),
          g: mathRound(g),
          b: mathRound(b),
          a: a
        };
      },
      toRgbString: function () {
        return (a == 1) ? "rgb(" + mathRound(r) + ", " + mathRound(g) + ", " + mathRound(b) + ")" : "rgba(" + mathRound(r) + ", " + mathRound(g) + ", " + mathRound(b) + ", " + a + ")";
      },
      toName: function () {
        return hexNames[rgbToHex(r, g, b)] || false;
      },
      toFilter: function () {
        var hex = rgbToHex(r, g, b);
        var alphaHex = Math.round(parseFloat(a) * 255).toString(16);
        return "progid:DXImageTransform.Microsoft.gradient(startColorstr=#" + alphaHex + hex + ",endColorstr=#" + alphaHex + hex + ")";
      },
      toString: function (format) {
        format = format || this.format;
        var formattedString = false;
        if (format === "rgb") {
          formattedString = this.toRgbString();
        }
        if (format === "hex") {
          formattedString = this.toHexString();
        }
        if (format === "hex6") {
          formattedString = this.toHexString(true);
        }
        if (format === "name") {
          formattedString = this.toName();
        }
        if (format === "hsl") {
          formattedString = this.toHslString();
        }
        if (format === "hsv") {
          formattedString = this.toHsvString();
        }
        return formattedString || this.toHexString();
      }
    };
  }
  // If input is an object, force 1 into "1.0" to handle ratios properly
  // String input requires "1.0" as input, so 1 will be treated as 1
  tinycolor.fromRatio = function (color) {
    if (typeof color == "object") {
      for (var i in color) {
        if (color[i] === 1) {
          color[i] = "1.0";
        }
      }
    }
    return tinycolor(color);
  }
  // Given a string or object, convert that input to RGB
  // Possible string inputs:
  //
  //     "red"
  //     "#f00" or "f00"
  //     "#ff0000" or "ff0000"
  //     "rgb 255 0 0" or "rgb (255, 0, 0)"
  //     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
  //     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
  //     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1" 
  //     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
  //     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
  //     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
  //

  function inputToRGB(color) {
    var rgb = {
      r: 0,
      g: 0,
      b: 0
    };
    var a = 1;
    var ok = false;
    var format = false;
    if (typeof color == "string") {
      color = stringInputToObject(color);
    }
    if (typeof color == "object") {
      if (color.hasOwnProperty("r") && color.hasOwnProperty("g") && color.hasOwnProperty("b")) {
        rgb = rgbToRgb(color.r, color.g, color.b);
        ok = true;
        format = "rgb";
      } else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("v")) {
        rgb = hsvToRgb(color.h, color.s, color.v);
        ok = true;
        format = "hsv";
      } else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("l")) {
        var rgb = hslToRgb(color.h, color.s, color.l);
        ok = true;
        format = "hsl";
      }
      if (color.hasOwnProperty("a")) {
        a = color.a;
      }
    }
    rgb.r = mathMin(255, mathMax(rgb.r, 0));
    rgb.g = mathMin(255, mathMax(rgb.g, 0));
    rgb.b = mathMin(255, mathMax(rgb.b, 0));
    // Don't let the range of [0,255] come back in [0,1].  
    // Potentially lose a little bit of precision here, but will fix issues where
    // .5 gets interpreted as half of the total, instead of half of 1.
    // If it was supposed to be 128, this was already taken care of in the conversion function
    if (rgb.r < 1) {
      rgb.r = mathRound(rgb.r);
    }
    if (rgb.g < 1) {
      rgb.g = mathRound(rgb.g);
    }
    if (rgb.b < 1) {
      rgb.b = mathRound(rgb.b);
    }
    return {
      ok: ok,
      format: (color && color.format) || format,
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      a: a
    };
  }
  // Conversion Functions
  // --------------------
  // `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:   
  // <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>
  // `rgbToRgb`  
  // Handle bounds / percentage checking to conform to CSS color spec
  // <http://www.w3.org/TR/css3-color/>  
  // *Assumes:* r, g, b in [0, 255] or [0, 1]  
  // *Returns:* { r, g, b } in [0, 255]

  function rgbToRgb(r, g, b) {
    return {
      r: bound01(r, 255) * 255,
      g: bound01(g, 255) * 255,
      b: bound01(b, 255) * 255
    };
  }
  // `rgbToHsl`  
  // Converts an RGB color value to HSL.  
  // *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]  
  // *Returns:* { h, s, l } in [0,1]  

  function rgbToHsl(r, g, b) {
    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);
    var max = mathMax(r, g, b),
      min = mathMin(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max == min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      }
      h /= 6;
    }
    return {
      h: h,
      s: s,
      l: l
    };
  }
  // `hslToRgb`  
  // Converts an HSL color value to RGB.  
  // *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]  
  // *Returns:* { r, g, b } in the set [0, 255]  

  function hslToRgb(h, s, l) {
    var r, g, b;
    h = bound01(h, 360);
    s = bound01(s, 100);
    l = bound01(l, 100);

    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return {
      r: r * 255,
      g: g * 255,
      b: b * 255
    };
  }
  // `rgbToHsv`  
  // Converts an RGB color value to HSV  
  // *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]  
  // *Returns:* { h, s, v } in [0,1]  

  function rgbToHsv(r, g, b) {
    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);
    var max = mathMax(r, g, b),
      min = mathMin(r, g, b);
    var h, s, v = max;
    var d = max - min;
    s = max == 0 ? 0 : d / max;
    if (max == min) {
      h = 0; // achromatic
    } else {
      switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      }
      h /= 6;
    }
    return {
      h: h,
      s: s,
      v: v
    };
  }
  // `hsvToRgb`  
  // Converts an HSV color value to RGB. 
  // *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
  // *Returns:* { r, g, b } in the set [0, 255]

  function hsvToRgb(h, s, v) {
    var r, g, b;
    h = bound01(h, 360) * 6;
    s = bound01(s, 100);
    v = bound01(v, 100);
    var i = math.floor(h),
      f = h - i,
      p = v * (1 - s),
      q = v * (1 - f * s),
      t = v * (1 - (1 - f) * s),
      mod = i % 6,
      r = [v, q, p, p, t, v][mod],
      g = [t, v, v, q, p, p][mod],
      b = [p, p, t, v, v, q][mod];
    return {
      r: r * 255,
      g: g * 255,
      b: b * 255
    };
  }
  // `rgbToHex`  
  // Converts an RGB color to hex  
  // Assumes r, g, and b are contained in the set [0, 255]  
  // Returns a 3 or 6 character hex  

  function rgbToHex(r, g, b, force6Char) {
    function pad(c) {
      return c.length == 1 ? '0' + c : '' + c;
    }
    var hex = [
    pad(mathRound(r).toString(16)), pad(mathRound(g).toString(16)), pad(mathRound(b).toString(16))];
    // Return a 3 character hex if possible
    if (!force6Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
      return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
    }
    return hex.join("");
  }
  // `equals`  
  // Can be called with any tinycolor input
  tinycolor.equals = function (color1, color2) {
    if (!color1 || !color2) {
      return false;
    }
    return tinycolor(color1).toHex() == tinycolor(color2).toHex();
  };
  tinycolor.random = function () {
    return tinycolor.fromRatio({
      r: mathRandom(),
      g: mathRandom(),
      b: mathRandom()
    });
  };
  // Modification Functions
  // ----------------------
  // Thanks to less.js for some of the basics here  
  // <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>
  tinycolor.desaturate = function (color, amount) {
    var hsl = tinycolor(color).toHsl();
    hsl.s -= ((amount || 10) / 100);
    hsl.s = clamp01(hsl.s);
    return tinycolor(hsl);
  };
  tinycolor.saturate = function (color, amount) {
    var hsl = tinycolor(color).toHsl();
    hsl.s += ((amount || 10) / 100);
    hsl.s = clamp01(hsl.s);
    return tinycolor(hsl);
  };
  tinycolor.greyscale = function (color) {
    return tinycolor.desaturate(color, 100);
  };
  tinycolor.lighten = function (color, amount) {
    var hsl = tinycolor(color).toHsl();
    hsl.l += ((amount || 10) / 100);
    hsl.l = clamp01(hsl.l);
    return tinycolor(hsl);
  };
  tinycolor.darken = function (color, amount) {
    var hsl = tinycolor(color).toHsl();
    hsl.l -= ((amount || 10) / 100);
    hsl.l = clamp01(hsl.l);
    return tinycolor(hsl);
  };
  tinycolor.complement = function (color) {
    var hsl = tinycolor(color).toHsl();
    hsl.h = (hsl.h + .5) % 1;
    return tinycolor(hsl);
  };
  // Combination Functions
  // ---------------------
  // Thanks to jQuery xColor for some of the ideas behind these
  // <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>
  tinycolor.triad = function (color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h * 360;
    return [
    tinycolor(color), tinycolor({
      h: (h + 120) % 360,
      s: hsl.s,
      l: hsl.l
    }), tinycolor({
      h: (h + 240) % 360,
      s: hsl.s,
      l: hsl.l
    })];
  };
  tinycolor.tetrad = function (color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h * 360;
    return [
    tinycolor(color), tinycolor({
      h: (h + 90) % 360,
      s: hsl.s,
      l: hsl.l
    }), tinycolor({
      h: (h + 180) % 360,
      s: hsl.s,
      l: hsl.l
    }), tinycolor({
      h: (h + 270) % 360,
      s: hsl.s,
      l: hsl.l
    })];
  };
  tinycolor.splitcomplement = function (color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h * 360;
    return [
    tinycolor(color), tinycolor({
      h: (h + 72) % 360,
      s: hsl.s,
      l: hsl.l
    }), tinycolor({
      h: (h + 216) % 360,
      s: hsl.s,
      l: hsl.l
    })];
  };
  tinycolor.analogous = function (color, results, slices) {
    results = results || 6;
    slices = slices || 30;
    var hsl = tinycolor(color).toHsl();
    var part = 360 / slices
    var ret = [tinycolor(color)];
    hsl.h *= 360;
    for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results;) {
      hsl.h = (hsl.h + part) % 360;
      ret.push(tinycolor(hsl));
    }
    return ret;
  };
  tinycolor.monochromatic = function (color, results) {
    results = results || 6;
    var hsv = tinycolor(color).toHsv();
    var h = hsv.h,
      s = hsv.s,
      v = hsv.v;
    var ret = [];
    var modification = 1 / results;
    while (results--) {
      ret.push(tinycolor({
        h: h,
        s: s,
        v: v
      }));
      v = (v + modification) % 1;
    }
    return ret;
  };
  tinycolor.readable = function (color1, color2) {
    var a = tinycolor(color1).toRgb(),
      b = tinycolor(color2).toRgb();
    return ((b.r - a.r) * (b.r - a.r) + (b.g - a.g) * (b.g - a.g) + (b.b - a.b) * (b.b - a.b)) > 0x28A4;
  };
  // Big List of Colors
  // ---------
  // <http://www.w3.org/TR/css3-color/#svg-color>
  var names = tinycolor.names = {
    aliceblue: "f0f8ff",
    antiquewhite: "faebd7",
    aqua: "0ff",
    aquamarine: "7fffd4",
    azure: "f0ffff",
    beige: "f5f5dc",
    bisque: "ffe4c4",
    black: "000",
    blanchedalmond: "ffebcd",
    blue: "00f",
    blueviolet: "8a2be2",
    brown: "a52a2a",
    burlywood: "deb887",
    burntsienna: "ea7e5d",
    cadetblue: "5f9ea0",
    chartreuse: "7fff00",
    chocolate: "d2691e",
    coral: "ff7f50",
    cornflowerblue: "6495ed",
    cornsilk: "fff8dc",
    crimson: "dc143c",
    cyan: "0ff",
    darkblue: "00008b",
    darkcyan: "008b8b",
    darkgoldenrod: "b8860b",
    darkgray: "a9a9a9",
    darkgreen: "006400",
    darkgrey: "a9a9a9",
    darkkhaki: "bdb76b",
    darkmagenta: "8b008b",
    darkolivegreen: "556b2f",
    darkorange: "ff8c00",
    darkorchid: "9932cc",
    darkred: "8b0000",
    darksalmon: "e9967a",
    darkseagreen: "8fbc8f",
    darkslateblue: "483d8b",
    darkslategray: "2f4f4f",
    darkslategrey: "2f4f4f",
    darkturquoise: "00ced1",
    darkviolet: "9400d3",
    deeppink: "ff1493",
    deepskyblue: "00bfff",
    dimgray: "696969",
    dimgrey: "696969",
    dodgerblue: "1e90ff",
    firebrick: "b22222",
    floralwhite: "fffaf0",
    forestgreen: "228b22",
    fuchsia: "f0f",
    gainsboro: "dcdcdc",
    ghostwhite: "f8f8ff",
    gold: "ffd700",
    goldenrod: "daa520",
    gray: "808080",
    green: "008000",
    greenyellow: "adff2f",
    grey: "808080",
    honeydew: "f0fff0",
    hotpink: "ff69b4",
    indianred: "cd5c5c",
    indigo: "4b0082",
    ivory: "fffff0",
    khaki: "f0e68c",
    lavender: "e6e6fa",
    lavenderblush: "fff0f5",
    lawngreen: "7cfc00",
    lemonchiffon: "fffacd",
    lightblue: "add8e6",
    lightcoral: "f08080",
    lightcyan: "e0ffff",
    lightgoldenrodyellow: "fafad2",
    lightgray: "d3d3d3",
    lightgreen: "90ee90",
    lightgrey: "d3d3d3",
    lightpink: "ffb6c1",
    lightsalmon: "ffa07a",
    lightseagreen: "20b2aa",
    lightskyblue: "87cefa",
    lightslategray: "789",
    lightslategrey: "789",
    lightsteelblue: "b0c4de",
    lightyellow: "ffffe0",
    lime: "0f0",
    limegreen: "32cd32",
    linen: "faf0e6",
    magenta: "f0f",
    maroon: "800000",
    mediumaquamarine: "66cdaa",
    mediumblue: "0000cd",
    mediumorchid: "ba55d3",
    mediumpurple: "9370db",
    mediumseagreen: "3cb371",
    mediumslateblue: "7b68ee",
    mediumspringgreen: "00fa9a",
    mediumturquoise: "48d1cc",
    mediumvioletred: "c71585",
    midnightblue: "191970",
    mintcream: "f5fffa",
    mistyrose: "ffe4e1",
    moccasin: "ffe4b5",
    navajowhite: "ffdead",
    navy: "000080",
    oldlace: "fdf5e6",
    olive: "808000",
    olivedrab: "6b8e23",
    orange: "ffa500",
    orangered: "ff4500",
    orchid: "da70d6",
    palegoldenrod: "eee8aa",
    palegreen: "98fb98",
    paleturquoise: "afeeee",
    palevioletred: "db7093",
    papayawhip: "ffefd5",
    peachpuff: "ffdab9",
    peru: "cd853f",
    pink: "ffc0cb",
    plum: "dda0dd",
    powderblue: "b0e0e6",
    purple: "800080",
    red: "f00",
    rosybrown: "bc8f8f",
    royalblue: "4169e1",
    saddlebrown: "8b4513",
    salmon: "fa8072",
    sandybrown: "f4a460",
    seagreen: "2e8b57",
    seashell: "fff5ee",
    sienna: "a0522d",
    silver: "c0c0c0",
    skyblue: "87ceeb",
    slateblue: "6a5acd",
    slategray: "708090",
    slategrey: "708090",
    snow: "fffafa",
    springgreen: "00ff7f",
    steelblue: "4682b4",
    tan: "d2b48c",
    teal: "008080",
    thistle: "d8bfd8",
    tomato: "ff6347",
    turquoise: "40e0d0",
    violet: "ee82ee",
    wheat: "f5deb3",
    white: "fff",
    whitesmoke: "f5f5f5",
    yellow: "ff0",
    yellowgreen: "9acd32"
  };
  // Make it easy to access colors via `hexNames[hex]`
  var hexNames = tinycolor.hexNames = flip(names);
  // Utilities
  // ---------
  // `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`

  function flip(o) {
    var flipped = {};
    for (var i in o) {
      if (o.hasOwnProperty(i)) {
        flipped[o[i]] = i;
      }
    }
    return flipped;
  }
  // Take input from [0, n] and return it as [0, 1]

  function bound01(n, max) {
    if (isOnePointZero(n)) {
      n = "100%";
    }
    var processPercent = isPercentage(n);
    n = mathMin(max, mathMax(0, parseFloat(n)));
    // Automatically convert percentage into number
    if (processPercent) {
      n = n * (max / 100);
    }
    // Handle floating point rounding errors
    if ((math.abs(n - max) < 0.000001)) {
      return 1;
    } else if (n >= 1) {
      return (n % max) / parseFloat(max);
    }
    return n;
  }
  // Force a number between 0 and 1

  function clamp01(val) {
    return mathMin(1, mathMax(0, val));
  }
  // Parse an integer into hex

  function parseHex(val) {
    return parseInt(val, 16);
  }
  // Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
  // <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>

  function isOnePointZero(n) {
    return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
  }
  // Check to see if string passed in is a percentage

  function isPercentage(n) {
    return typeof n === "string" && n.indexOf('%') != -1;
  }
  var matchers = (function () {
    // <http://www.w3.org/TR/css3-values/#integers>
    var CSS_INTEGER = "[-\\+]?\\d+%?";
    // <http://www.w3.org/TR/css3-values/#number-value>
    var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";
    // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
    var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";
    // Actual matching.  
    // Parentheses and commas are optional, but not required.  
    // Whitespace can take the place of commas or opening paren
    var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
    var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
    return {
      rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
      rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
      hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
      hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
      hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
      hex3: /^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
      hex6: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
    };
  })();
  // `stringInputToObject`  
  // Permissive string parsing.  Take in a number of formats, and output an object
  // based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`

  function stringInputToObject(color) {
    color = color.replace(trimLeft, '').replace(trimRight, '').toLowerCase();
    var named = false;
    if (names[color]) {
      color = names[color];
      named = true;
    } else if (color == 'transparent') {
      return {
        r: 0,
        g: 0,
        b: 0,
        a: 0
      };
    }
    // Try to match string input using regular expressions.  
    // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]  
    // Just return an object and let the conversion functions handle that.  
    // This way the result will be the same whether the tinycolor is initialized with string or object.
    var match;
    if ((match = matchers.rgb.exec(color))) {
      return {
        r: match[1],
        g: match[2],
        b: match[3]
      };
    }
    if ((match = matchers.rgba.exec(color))) {
      return {
        r: match[1],
        g: match[2],
        b: match[3],
        a: match[4]
      };
    }
    if ((match = matchers.hsl.exec(color))) {
      return {
        h: match[1],
        s: match[2],
        l: match[3]
      };
    }
    if ((match = matchers.hsla.exec(color))) {
      return {
        h: match[1],
        s: match[2],
        l: match[3],
        a: match[4]
      };
    }
    if ((match = matchers.hsv.exec(color))) {
      return {
        h: match[1],
        s: match[2],
        v: match[3]
      };
    }
    if ((match = matchers.hex6.exec(color))) {
      return {
        r: parseHex(match[1]),
        g: parseHex(match[2]),
        b: parseHex(match[3]),
        format: named ? "name" : "hex"
      };
    }
    if ((match = matchers.hex3.exec(color))) {
      return {
        r: parseHex(match[1] + '' + match[1]),
        g: parseHex(match[2] + '' + match[2]),
        b: parseHex(match[3] + '' + match[3]),
        format: named ? "name" : "hex"
      };
    }
    return false;
  }
  // Everything is ready, expose to window
  window.tinycolor = tinycolor;
})(this);

});

require.define("/app/js/views/home.js",function(require,module,exports,__dirname,__filename,process){
require('../../vendor/js/bootstrap.min.js')
require('./universal.js')

var doneOnce = false

var Color = require('color')
var spectrum = require('../../vendor/js/spectrum.js')

jQuery(function($){
  $('#phone-tf').mask("999-999-9999", {placeholder:""})
  .css('color','rgba(0,0,0,0.6)')
  // $('#zip-tf').mask("99999", {placeholder:"_"})
  // .css('color','rgba(0,0,0,0.6)')
});

$('.helper').popover({
  trigger: 'hover',
  title: 'help'
})

$('.nav-tabs').button()

$(document).ready(function(){

	var hc = new HomeController();
	var av = new AccountValidator();
	
	$('form#account-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			if (av.validateForm() == false){
				return false;
			} 	else{
				formData.push({name:'user', value:$('#user-tf').val()})
				formData.push({cust:'cust', value:$('#cust-tf').val()})
				return true;
			}
		},
		success	: function(responseText, status, xhr, $form){
			if (status == 'success') hc.onUpdateSuccess();
		},
		error : function(e){
			if (e.responseText == 'email-taken'){
			    av.showInvalidEmail();
			}	else if (e.responseText == 'username-taken'){
			    av.showInvalidUserName();			
			}
		}
	});


// customize the account settings form //
	
	$('#user-tf').attr('disabled', 'disabled');

  $('.modal-confirm').modal({ show : false, keyboard : true, backdrop : true });
  $('.modal-confirm .modal-header h3').text('Delete Account');
  $('.modal-confirm .modal-body p').html('Are you sure you want to delete your account?');	
	$('.modal-confirm .cancel').html('Cancel');
	$('.modal-confirm .submit').html('Delete');
	$('.modal-confirm .submit').addClass('btn-danger');

  var u = $('input#color-picker').val()


  $('section#sidebar>div.inner').css('backgroundColor', u )
  $('section#logos li').css({ backgroundColor: u })
  $('.coupon .symbol-container .symbol').css({ backgroundColor: u })

  $('nav#nav-home a').on('click', function(){
    $this = $(this)

    if($(this).parent().is('li.active,li.disabled')){
      return
    }


    $this.parent().addClass('active')
    $this.parent().siblings().removeClass('active')

    var o = $this.attr('id');
    var e = $('article>#'+o)
    var r = $('nav#nav-top>#'+o)

    $('section#content').fadeOut('fast',function(){
      if( !doneOnce ){
        $('#nav-top').show()
      }
      e.siblings().hide();
      e.show();
      r.siblings('h1').hide();
      r.css({ display: 'inline-block' })

      $(this).fadeIn('fast')
    })
  });

  $('#logos li').on('click',function(){
    var t = $(this)
    var tc = $(this).children()
    var s = $(this).siblings('li')
    var sc = $(this).siblings('li').children()
    var id = $(this).children().attr('data-image')

    t.addClass('selected')
    tc.css({ opacity: '1'});
    s.removeClass('selected')
    sc.css({ opacity: '0.4' });
    t.siblings('input').val( id )
  })

  $('#color-picker').spectrum({
    color: $(this).val(),
    move: function(o){
      var x = o.toHexString()
      var xl = Color(x).lighten(0.6).desaturate(0.5).hexString()
      $('#sidebar>.inner').css("backgroundColor", x )
      $('section#logos li').css("backgroundColor", x )
      $('button.Color').css("backgroundColor", xl )
      $('.coupon .symbol-container .symbol').css("backgroundColor", x )
      $('input#color-picker').val(x)
    }
  });


  $('ul.chzn-results>li:contains("locked")').addClass('group-result').removeClass('group-option').css({display:"list-item"});

  var couponBody = $('textarea#coupon_body').attr('data-text')
  $('textarea#coupon_body').text( couponBody )

})

$(function(){

  $('#category .chzn-results>li').on('click', function(){
    var txt = $(this).text()
    $('#tags ul.chzn-results>li').removeClass('result-selected').addClass('active-result')
    $('#tags ul.chzn-choices>li.search-choice').remove()
    $('#tags>#'+txt).siblings().hide()
    $('#tags>#'+txt).show()
  });

  $('#tags .chzn-choices').on('click', function(){
    var count = $(this).children('li').length;
    if(count >= 4){ 
      $(this).siblings('.chzn-drop').hide();
    }else{
      $(this).siblings('.chzn-drop').show();
    }
  });

  $('button.lq').on('click', function(){
    var $this = $(this)

    var v = $this.text()
    var d = $this.parents('ul').prevAll('ul').children('li')
    var e = $this.parents('ul').prevAll('ul').find('button.lq')
    var f = $this.parents('ul').nextAll('ul').children('li')
    var g = $this.parents('ul').nextAll('ul').find('button.lq')

    $($this, e).addClass('active')
    $($this, d).siblings().fadeIn()
    g.removeClass('active')
    f.fadeOut()

    $('input.lq').val(v)
  })

  $('.date').each(function(){
    var h = $(this).html()
    $(this).text(moment(h).fromNow())
  })

});


});
require("/app/js/views/home.js");
})();
