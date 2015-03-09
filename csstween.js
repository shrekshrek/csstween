/*!
 * VERSION: 0.1.0
 * DATE: 2015-01-09
 * GIT:https://github.com/shrekshrek/csstween
 *
 * @author: Shrek.wang, shrekshrek@gmail.com
 **/

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports'], function(exports) {
            root.CT = root.CssTween = factory(root, exports);
        });
    } else if (typeof exports !== 'undefined') {
        factory(root, exports);
    } else {
        root.CT = root.CssTween = factory(root, {});
    }

}(this, function(root, CT) {

    var previousCssTween = root.CT;

    CT.VERSION = '0.1.0';

    CT.noConflict = function() {
        root.CT = previousCssTween;
        return this;
    };

    // --------------------------------------------------------------------extend
    CT.extend = function(obj) {
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    };

    // --------------------------------------------------------------------全局属性
    var _isSupported = false;
    var _browserPrefix = 'webkit';
    var _transitionEvent = 'transitionend';

    CT.checkSupport = function() {
        var _d = document.createElement('div');
        var _prefixes = ['', 'webkit', 'Moz', 'O', 'ms'];

        for (var i in _prefixes) {
            if ((_prefixes[i] + 'Transition') in _d.style) {
                _isSupported = true;
                _browserPrefix = _prefixes[i];
                if(!(_browserPrefix === '' || _browserPrefix === 'Moz')) _transitionEvent = _browserPrefix.toLowerCase() + 'TransitionEnd';
                return true;
            }
        }
        return false;
    };

    CT.browserPrefix = function(str) {
        if (arguments.length) {
            return _browserPrefix + str;
        } else {
            return _browserPrefix;
        }
    };

    // --------------------------------------------------------------------缓动选项
    CT.extend({
        Linear: {
            easeIn:'(0, 0, 1, 1)',
            easeOut:'(0, 0, 1, 1)',
            easeInOut:'(0, 0, 1, 1)'
        },
        Sine: {
            easeIn:'(0.35, 0, 1, 1)',
            easeOut:'(0, 0, 0.65, 1)',
            easeInOut:'(0.35, 0, 0.65, 1)'
        },
        Quad: {
            easeIn:'(0.45, 0, 1, 1)',
            easeOut:'(0, 0, 0.55, 1)',
            easeInOut:'(0.45, 0, 0.55, 1)'
        },
        Quart: {
            easeIn:'(0.75, 0, 1, 1)',
            easeOut:'(0, 0, 0.25, 1)',
            easeInOut:'(0.75, 0, 0.25, 1)'
        },
        Expo: {
            easeIn:'(1, 0, 1, 1)',
            easeOut:'(0, 0, 0, 1)',
            easeInOut:'(1, 0, 0, 1)'
        }
    });

    // --------------------------------------------------------------------功能实现主体
    var _handlers = {};
    var _handlerId = 0;

    var _requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    function _waitHandler(fun){
        _requestAnimationFrame(function() {
            //_requestAnimationFrame(function() {
                fun();
            //});
        });
    }

    function _getElement(dom){
        if (!(_isSupported || CT.checkSupport())) {
            throw "this browser does not support css animation!!!";
            return;
        }
        if(!dom){
            throw "dom is undefined, can't tween!!!";
            return;
        }

        switch(typeof(dom)){
            case 'string':
                return (typeof(document) === 'undefined') ? dom : (document.querySelectorAll ? document.querySelectorAll(dom) : document.getElementById((dom.charAt(0) === '#') ? dom.substr(1) : dom));
                break;
            case 'object':
                return dom;
                break;
            default :
                throw "dom is undefined, can't tween!!!";
                break;
        }
    }

    function _tween(target, duration, fromParams, toParams){
        var _dom = target;

        _setStyle(_dom, fromParams);

        _waitHandler(function(){
            var _duration = '';
            if(duration){
                _duration = duration + 's';
            }else{
                _duration = '0s';
            }

            var _ease = 'cubic-bezier(0, 0, 1, 1)';
            var _delay = '0s';
            var _callback = '';
            var _callbackParams = [];
            for(var i in toParams){
                switch(i){
                    case 'ease':
                        _ease = 'cubic-bezier' + toParams[i];
                        break;
                    case 'delay':
                        _delay = toParams[i] + 's';
                        break;
                    case 'onComplete':
                        _callback = toParams[i];
                        break;
                    case 'onCompleteParams':
                        _callbackParams = toParams[i];
                        break;
                }
            }
            _addEventHandler(_dom, _transitionEvent, _endHandler, {dom:_dom, callback:_callback, params:_callbackParams});

            _dom.style[CT.browserPrefix('Transition')] = 'all ' + _duration + ' ' + _ease + ' ' + _delay;

            _waitHandler(function(){
                _setStyle(_dom, toParams);
            });
        });
    }

    function _endHandler(obj){
        obj.dom.style[CT.browserPrefix('Transition')] = 'none';
        _removeEventHandler(obj.dom, _transitionEvent);
        _waitHandler(function() {
            obj.callback.apply(obj.dom, obj.params);
        });
    }

    function _getStyle(dom, param){
        var _dom = dom;
        var _param = '';
        switch(param){
            case 'transform':
                _param = _dom.style[CT.browserPrefix('Transform')];
                break;
            default:
                _param = param;
                break;
        }

        if(_dom.style[_param]){
            return _dom.style[_param];
        }else if(_dom.currentStyle){
            return _dom.currentStyle[_param];
        }else if(document.defaultView && document.defaultView.getComputedStyle){
            var _p = _param.replace(/([A-Z])/g,'-$1').toLowerCase();
            var _s = document.defaultView.getComputedStyle(_dom,'');
            return _s && _s.getPropertyValue(_p);
        }else{
            return null;
        }
    }

    function _setStyle(dom, params){
        var _dom = dom;
        for(var i in params){
            switch(i){
                case 'ease':
                case 'delay':
                case 'onComplete':
                case 'onCompleteParams':
                    break;
                case 'fontWeight':
                case 'opacity':
                case 'outlineOffset':
                case 'zIndex':
                case 'zoom':
                    _dom.style[i] = params[i];
                    break;
                case 'transform':
                    _dom.style[CT.browserPrefix('Transform')] = params[i];
                    break;
                default:
                    _dom.style[i] = typeof(params[i]) === 'number' ? params[i] + 'px' : params[i];
                    break;
            }
        }
    }

    function _addEventHandler(dom, eventName, fun, param){
        var _self = this;
        var _fun = fun;
        if(param)
        {
            _fun = function()
            {
                fun.call(_self, param);
            }
        }
        if(dom.addEventListener){
            dom.addEventListener(eventName, _fun, false);
        }else if(dom.attachEvent){
            dom.attachEvent('on'+eventName, _fun);
        }else{
            dom['on' + eventName] = _fun;
        }

        if(!dom._ct_hid){
            dom._ct_hid = ++_handlerId;
        }
        if(!_handlers[dom._ct_hid]){
            _handlers[dom._ct_hid] = [];
        }
        _handlers[dom._ct_hid].push({dom:dom, event:eventName, handler:_fun, callback:fun});
    }

    function _removeEventHandler(dom, eventName) {
        if(!dom._ct_hid) return;
        var _h = _handlers[dom._ct_hid];
        for(var i = _h.length - 1; i >= 0; i--){
            if(_h[i].event === eventName){
                var _fun = _h[i].handler;
                if (dom.removeEventListener) {
                    dom.removeEventListener(eventName, _fun);
                }else if (dom.detachEvent){
                    dom.detachEvent('on' + eventName, _fun);
                }else{
                    delete dom['on' + eventName];
                }
                _h.splice(i,1);
            }
        }
    }


    // --------------------------------------------------------------------主要方法
    CT.extend({
        get: function(target, param){
            var _dom = _getElement(target);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                return _getStyle(_d,param);
            }
        },

        set: function(target, params){
            var _dom = _getElement(target);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                _setStyle(_d, params);
            }
        },

        fromTo: function(target, duration, fromParams, toParams){
            var _dom = _getElement(target);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                _tween(_d, duration, fromParams, toParams);
            }
        },

        from: function(target, duration, fromParams){
            var _dom = _getElement(target);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                var _toParams = {};
                for(var j in fromParams){
                    if(_d.style[j] !== undefined){
                        _toParams[j] = _getStyle(_d, j);
                    }else{
                        _toParams[j] = fromParams[j];
                    }
                }
                _tween(_d, duration, fromParams, _toParams);
            }
        },

        to: function(target, duration, toParams){
            var _dom = _getElement(target);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                var _fromParams = {};
                _tween(_d, duration, _fromParams, toParams);
            }
        },

        kill: function(target){
            var _dom = _getElement(target);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                _removeEventHandler(_d, _transitionEvent);
                _d.style[CT.browserPrefix('Transition')] = 'none';
            }
        },

        killAll: function(){
            for(var i in _handlers){
                var _a = _handlers[i];
                for(var j in _a){
                    var _d = _a[j].dom;
                    this.kill(_d, _transitionEvent);
                }
            }
        }

    });

    return CT;
}));
