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
    var _browserPrefix = "webkit";

    CTL.checkSupport = function() {
        var _d = document.createElement("div"), _prefixes = ["", "webkit", "Moz", "O", "ms"], _len = _prefixes.length, i;

        for ( i = 0; i < _len; i++) {
            if ((_prefixes[i] + "Animation") in _d.style) {
                _isSupported = true;
                _browserPrefix = _prefixes[i];
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
    var _endEvents = ['transitionend', 'webkitTransitionEnd', 'oTransitionEnd'];
    var _handlers = {};
    var _handlerId = 0;

    var _requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    function _waitHandler(fun){
        _requestAnimationFrame(function() {
            fun();
        });
    }

    function _getElement(obj){
        switch(typeof(obj)){
            case 'string':
                return (typeof(document) === "undefined") ? obj : (document.querySelectorAll ? document.querySelectorAll(obj) : document.getElementById((obj.charAt(0) === "#") ? obj.substr(1) : obj));
                break;
            case 'object':
                return obj;
                break;
            default :
                throw "dom is undefined, can't tween!!!";
                break;
        }
    }

    function _tween(dom, duration, params){
        var _dom = dom;

        var _duration = '';
        if(duration){
            _duration = duration + 's';
        }else{
            _duration = '0s';
        }

        var _ease = 'cubic-bezier(0, 0, 1, 1)';
        var _delay = '0s';
        for(var i in params){
            switch(i){
                case "ease":
                    _ease = 'cubic-bezier' + params[i];
                    break;
                case "delay":
                    _delay = params[i] + 's';
                    break;
                case 'onComplete':
                    for(var j in _endEvents){
                        _addEventHandler(_dom, _endEvents[j], _endHandler, {dom:_dom, fun:params[i]});
                    }
                    break;
            }
        }

        _dom.style[_browserPrefix + "Transition"] = 'all ' + _duration + ' ' + _ease + ' ' + _delay;

        _waitHandler(function(){
            _paramHandler(_dom, params);
        });
    }

    function _endHandler(obj){
        obj.dom.style[_browserPrefix + "Transition"] = 'none';
        for (var j in _endEvents) {
            _removeEventHandler(obj.dom, _endEvents[j]);
        }
        _waitHandler(function() {
            obj.fun();
        });
    }

    function _paramHandler(dom, params){
        var _dom = dom;
        for(var i in params){
            switch(i){
                case "ease":
                case "delay":
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

    function _addEventHandler(obj, eventName, fun, param){
        var _self = this;
        var _fun = fun;
        if(param)
        {
            _fun = function(e)
            {
                fun.call(_self, param);
            }
        }
        if(obj.addEventListener){
            obj.addEventListener(eventName, _fun, false);
        }else if(obj.attachEvent){
            obj.attachEvent('on'+eventName, _fun);
        }else{
            obj["on" + eventName] = _fun;
        }

        if(!obj._ct_hid){
            obj._ct_hid = ++_handlerId;
        }
        if(!_handlers[obj._ct_hid]){
            _handlers[obj._ct_hid] = [];
        }
        _handlers[obj._ct_hid].push({event:eventName, handler:_fun, callback:fun});
    }

    function _removeEventHandler(obj, eventName) {
        if(!obj._ct_hid) return;
        var _h = _handlers[obj._ct_hid];
        for(var i = _h.length - 1; i >= 0; i--){
            if(_h[i].event === eventName){
                _fun = _h[i].handler;
                if (obj.removeEventListener) {
                    obj.removeEventListener(eventName, _fun);
                }else if (obj.detachEvent){
                    obj.detachEvent("on" + eventName, _fun);
                }else{
                    delete obj["on" + eventName];
                }
                _h.splice(i,1);
            }
        }
    }

    CTL.extend({
        from: function(dom, duration, params){
            if (!(_isSupported || this.checkSupport())) {
                throw "this browser does not support css animation!!!";
                return;
            }

            if(!dom){
                throw "dom is undefined, can't tween!!!";
                return;
            }

            var _dom = _getElement(dom);

            if(_dom.length){
                for(var i = 0, len = _dom.length; i < len; i++){
                    var _params = {};
                    var _d = _dom[i];
                    for(var j in params){
                        if(_d.style[j]){
                            _params[j] = _d.style[j];
                        }else{
                            _params[j] = params[j];
                        }
                    }
                    _paramHandler(_d, params);
                    _waitHandler(function() {
                        _tween(_d, duration, _params);
                    });
                }
            }else{
                var _params = {};
                for(var j in params){
                    if(_dom.style[j]){
                        _params[j] = _dom.style[j];
                    }else{
                        _params[j] = params[j];
                    }
                }
                _paramHandler(_dom, params);
                _waitHandler(function() {
                    _tween(_dom, duration, _params);
                });
            }
        },

        to: function(dom, duration, params){
            if (!(_isSupported || this.checkSupport())) {
                throw "this browser does not support css animation!!!";
                return;
            }

            if(!dom){
                throw "dom is undefined, can't tween!!!";
                return;
            }

            var _dom = _getElement(dom);

            if(_dom.length){
                for(var i = 0, len = _dom.length; i < len; i++){
                    var _d = _dom[i];
                    _waitHandler(function() {
                        _tween(_d, duration, params);
                    });
                }
            }else{
                _waitHandler(function() {
                    _tween(_dom, duration, params);
                });
            }
        },

        fromTo: function(dom, duration, params, params2){
            if (!(_isSupported || this.checkSupport())) {
                throw "this browser does not support css animation!!!";
                return;
            }

            if(!dom){
                throw "dom is undefined, can't tween!!!";
                return;
            }

            var _dom = _getElement(dom);

            if(_dom.length){
                for(var i = 0, len = _dom.length; i < len; i++){
                    var _d = _dom[i];
                    _paramHandler(_d, params);
                    _waitHandler(function(){
                        _tween(_d, duration, params2);
                    });
                }
            }else{
                _paramHandler(_dom, params);
                _waitHandler(function(){
                    _tween(_dom, duration, params2);
                });
            }
        },

        kill: function(dom){
            if (!(_isSupported || this.checkSupport())) {
                throw "this browser does not support css animation!!!";
                return;
            }

            if(!dom){
                throw "dom is undefined, can't tween!!!";
                return;
            }

            var _dom = _getElement(dom);

            if(_dom.length){
                for(var i = 0, len = _dom.length; i < len; i++){
                    for(var j in _endEvents){
                        _removeEventHandler(_dom[i], _endEvents[j]);
                    }
                    _dom[i].style[_browserPrefix + "Transition"] = 'none';
                }
            }else{
                for(var j in _endEvents){
                    _removeEventHandler(_dom, _endEvents[j]);
                }
                _dom.style[_browserPrefix + "Transition"] = 'none';
            }
        }

    });

    return CTL;
}));
