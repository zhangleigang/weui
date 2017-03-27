/**
 * Created by jf on 2015/9/11.
 * Modified by bear on 2016/9/7.
 */
$(function() {
    var pageManager = {
        $container: $('#container'),
        _pageStack: [],
        _configs: [],
        _pageAppend: function() {},
        _defaultPage: null,
        _pageIndex: 1,
        setDefault: function(defaultPage) {
            this._defaultPage = this._find('name', defaultPage);
            return this;
        },
        setPageAppend: function(pageAppend) {
            this._pageAppend = pageAppend;
            return this;
        },
        init: function() {
            var self = this;

            $(window).on('hashchange', function() {
                var state = history.state || {};
                var url = location.hash.indexOf('#') === 0 ? location.hash : '#';
                var page = self._find('url', url) || self._defaultPage;
                if (state._pageIndex <= self._pageIndex || self._findInStack(url)) {
                    self._back(page);
                } else {
                    self._go(page);
                }
            });

            if (history.state && history.state._pageIndex) {
                this._pageIndex = history.state._pageIndex;
            }

            this._pageIndex--;

            var url = location.hash.indexOf('#') === 0 ? location.hash : '#';
            var page = self._find('url', url) || self._defaultPage;
            this._go(page);
            return this;
        },
        push: function(config) {
            this._configs.push(config);
            return this;
        },
        go: function(to) {
            var config = this._find('name', to);
            if (!config) {
                return;
            }
            location.hash = config.url;
        },
        _go: function(config) {
            this._pageIndex++;

            history.replaceState && history.replaceState({
                _pageIndex: this._pageIndex
            }, '', location.href);

            var html = $(config.template).html();
            var $html = $(html).addClass('slideIn').addClass(config.name);
            $html.on('animationend webkitAnimationEnd', function() {
                $html.removeClass('slideIn').addClass('js_show');
                adjustTabbar(location.hash.replace('#',''));
            });
            this.$container.append($html);
            this._pageAppend.call(this, $html);
            this._pageStack.push({
                config: config,
                dom: $html
            });

            if (!config.isBind) {
                this._bind(config);
            }

            Prism.highlightAll();

            return this;
        },
        back: function() {
            history.back();
        },
        _back: function(config) {
            this._pageIndex--;

            var stack = this._pageStack.pop();
            if (!stack) {
                return;
            }

            var url = location.hash.indexOf('#') === 0 ? location.hash : '#';
            var found = this._findInStack(url);
            if (!found) {
                var html = $(config.template).html();
                var $html = $(html).addClass('js_show').addClass(config.name);
                $html.insertBefore(stack.dom);

                if (!config.isBind) {
                    this._bind(config);
                }

                this._pageStack.push({
                    config: config,
                    dom: $html
                });
            }

            stack.dom.addClass('slideOut').on('animationend webkitAnimationEnd', function() {
                stack.dom.remove();
                adjustTabbar(location.hash.replace('#',''));
            });

            return this;
        },
        _findInStack: function(url) {
            var found = null;
            for (var i = 0, len = this._pageStack.length; i < len; i++) {
                var stack = this._pageStack[i];
                if (stack.config.url === url) {
                    found = stack;
                    break;
                }
            }
            return found;
        },
        _find: function(key, value) {
            var page = null;
            for (var i = 0, len = this._configs.length; i < len; i++) {
                if (this._configs[i][key] === value) {
                    page = this._configs[i];
                    break;
                }
            }
            return page;
        },
        _bind: function(page) {
            var events = page.events || {};
            for (var t in events) {
                for (var type in events[t]) {
                    this.$container.on(type, t, events[t][type]);
                }
            }
            page.isBind = true;
        }
    };

    function setPageManager() {
        var pages = {},
            tpls = $('script[type="text/html"]');
        var winH = $(window).height();

        for (var i = 0, len = tpls.length; i < len; ++i) {
            var tpl = tpls[i],
                name = tpl.id.replace(/tpl_/, '');

            pages[name] = {
                name: name,
                url: '#' + name,
                template: '#' + tpl.id
            };
        }
        pages.home.url = '#';

        for (var page in pages) {
            pageManager.push(pages[page]);
        }
        pageManager.setDefault('home').init();
    }

    function init() {
        setPageManager();

        window.pageManager = pageManager;
        window.home = function() {
            location.hash = '';
        };
    }

    function adjustTabbar(id) {
        var $item = $('.weui-tabbar a');

        if (id == 'dochome') {
            $($item[0]).removeClass('weui-bar__item_on');
            $($item[0]).find('span').removeClass('icon_API_HL').addClass('icon_API');
            $($item[1]).addClass('weui-bar__item_on');
            $($item[1]).find('span').removeClass('icon_component').addClass('icon_component_HL');
        } else if (id == 'home' || !id) {
            $($item[0]).addClass('weui-bar__item_on');
            $($item[0]).find('span').addClass('icon_API_HL').removeClass('icon_API');
            $($item[1]).removeClass('weui-bar__item_on');
            $($item[1]).find('span').addClass('icon_component').removeClass('icon_component_HL');
        }

        if (['dochome', 'home', ''].indexOf(id) > -1) {
            $('.weui-tabbar').show();
        } else {
            $('.weui-tabbar').fadeOut();
        }
    }

    init();
});

$(function() {
    var winH = $(window).height();
    var categorySpace = 10;
    // 高亮代码行
    Prism.highlightAll();

    $('body').on('click', '.js_item', function() {

        var id = $(this).data('id');
        window.pageManager.go(id);
    });

    $('body').on('click', '.js_category', function() {
        var $this = $(this),
            $inner = $this.next('.js_categoryInner'),
            $page = $this.parents('.page'),
            $parent = $(this).parent('li');
        var innerH = $inner.data('height');
        bear = $page;

        if (!innerH) {
            $inner.css('height', 'auto');
            innerH = $inner.height();
            $inner.removeAttr('style');
            $inner.data('height', innerH);
        }

        if ($parent.hasClass('js_show')) {
            $parent.removeClass('js_show');
        } else {
            $parent.siblings().removeClass('js_show');

            $parent.addClass('js_show');
            if (this.offsetTop + this.offsetHeight + innerH > $page.scrollTop() + winH) {
                var scrollTop = this.offsetTop + this.offsetHeight + innerH - winH + categorySpace;

                if (scrollTop > this.offsetTop) {
                    scrollTop = this.offsetTop - categorySpace;
                }

                $page.scrollTop(scrollTop);
            }
        }
    });
});
