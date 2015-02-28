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
            root.CTL = root.CssTweenLite = factory(root, exports);
        });
    } else if (typeof exports !== 'undefined') {
        factory(root, exports);
    } else {
        root.CTL = root.CssTweenLite = factory(root, {});
    }

}(this, function(root, CTL) {

    var previousCssTweeen = root.CTL;

    CTL.VERSION = '0.1.0';

    CTL.noConflict = function() {
        root.CTL = previousCssTweeen;
        return this;
    };

    // --------------------------------------------------------------------extend
    CTL.extend = function(obj) {
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    };

    // --------------------------------------------------------------------全局属性
    var _isSupported = false;
    var _browserPrefix = 'webkit';
    var _transitionEvent = 'transitionend';

    CTL.checkSupport = function() {
        var _d = document.createElement('div'), _prefixes = ['', 'webkit', 'Moz', 'O', 'ms'], _len = _prefixes.length, i;

        for ( i = 0; i < _len; i++) {
            if ((_prefixes[i] + 'Transition') in _d.style) {
                _isSupported = true;
                _browserPrefix = _prefixes[i];
                if(!(_browserPrefix === '' || _browserPrefix === 'Moz')) _transitionEvent = _browserPrefix.toLowerCase() + 'TransitionEnd';
                return true;
            }
        }
        return false;
    };

    CTL.browserPrefix = function(str) {
        if (arguments.length) {
            return _browserPrefix + str;
        } else {
            return _browserPrefix;
        }
    };

    // --------------------------------------------------------------------缓动选项
    CTL.extend({
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

    // --------------------------------------------------------------------主要方法
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
        if (!(_isSupported || CTL.checkSupport())) {
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

    function _tween(dom, duration, fromParams, toParams){
        var _dom = dom;

        _setParams(_dom, fromParams);

        _waitHandler(function(){
            var _duration = '';
            if(duration){
                _duration = duration + 's';
            }else{
                _duration = '0s';
            }

            var _ease = 'cubic-bezier(0, 0, 1, 1)';
            var _delay = '0s';
            for(var i in toParams){
                switch(i){
                    case 'ease':
                        _ease = 'cubic-bezier' + toParams[i];
                        break;
                    case 'delay':
                        _delay = toParams[i] + 's';
                        break;
                    case 'onComplete':
                        _addEventHandler(_dom, _transitionEvent, _endHandler, {dom:_dom, fun:toParams[i]});
                        break;
                }
            }
            _dom.style[CTL.browserPrefix('Transition')] = 'all ' + _duration + ' ' + _ease + ' ' + _delay;

            _waitHandler(function(){
                _setParams(_dom, toParams);
            });
        });
    }

    function _endHandler(obj){
        obj.dom.style[CTL.browserPrefix('Transition')] = 'none';
        _removeEventHandler(obj.dom, _transitionEvent);
        _waitHandler(function() {
            obj.fun();
        });
    }

    function _setParams(dom, params){
        var _dom = dom;
        for(var i in params){
            switch(i){
                case 'ease':
                case 'delay':
                case 'onComplete':
                    break;
                case 'fontWeight':
                case 'opacity':
                case 'zoom':
                    _dom.style[i] = params[i];
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
        _handlers[dom._ct_hid].push({event:eventName, handler:_fun, callback:fun});
    }

    function _removeEventHandler(dom, eventName) {
        if(!dom._ct_hid) return;
        var _h = _handlers[dom._ct_hid];
        for(var i = _h.length - 1; i >= 0; i--){
            if(_h[i].event === eventName){
                _fun = _h[i].handler;
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


    CTL.extend({
        fromTo: function(dom, duration, fromParams, toParams){
            var _dom = _getElement(dom);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                _tween(_d, duration, fromParams, toParams);
            }
        },

        from: function(dom, duration, fromParams){
            var _dom = _getElement(dom);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                var _toParams = {};
                for(var j in fromParams){
                    if(_d.style[j]){
                        _toParams[j] = _d.style[j];
                    }else{
                        _toParams[j] = fromParams[j];
                    }
                }
                _tween(_d, duration, fromParams, _toParams);
            }
        },

        to: function(dom, duration, toParams){
            var _dom = _getElement(dom);
            var _fromParams = {};
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                _tween(_d, duration, _fromParams, toParams);
            }
        },

        kill: function(dom){
            var _dom = _getElement(dom);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                _removeEventHandler(_d, _transitionEvent);
                _d.style[CTL.browserPrefix('Transition')] = 'none';
            }
        }

    });

    return CTL;
}));
