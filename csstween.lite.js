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
    var _requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    function waitHandler(fun){
        _requestAnimationFrame(function() {
            _requestAnimationFrame(function() {
                fun();
            });
        });
    }

    var _endEvents = ['transitionend', 'webkitTransitionEnd', 'oTransitionEnd'];
    var _handlers = {};
    var _handlerId = 0;

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

            var _self = this;
            var _dom = this._getElement(dom);

            if(_dom.length){
                for(var i = 0, len = _dom.length; i < len; i++){
                    var _params = {};
                    var _d = _dom[i];
                    for(var j in params){
                        switch(j){
                            case "ease":
                            case "delay":
                            case 'onComplete':
                                _params[j] = params[j];
                                break;
                            default:
                                _params[j] = _dom[i].style[j];
                                _d.style[j] = typeof(params[j]) === 'number' ? params[j] + 'px' : params[j];
                                break;
                        }
                    }
                    waitHandler(function() {
                        _self._tween(_d, duration, _params);
                    });
                }
            }else{
                var _params = {};
                for(var j in params){
                    switch(j){
                        case "ease":
                        case "delay":
                        case 'onComplete':
                            _params[j] = params[j];
                            break;
                        default:
                            _params[j] = _dom.style[j];
                            _dom.style[j] = typeof(params[j]) === 'number' ? params[j] + 'px' : params[j];
                            break;
                    }
                }
                waitHandler(function() {
                    _self._tween(_dom, duration, _params);
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

            var _dom = this._getElement(dom);

            if(_dom.length){
                for(var i = 0, len = _dom.length; i < len; i++){
                    this._tween(_dom[i], duration, params);
                }
            }else{
                this._tween(_dom, duration, params);
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

            var _self = this;
            var _dom = this._getElement(dom);

            if(_dom.length){
                for(var i = 0, len = _dom.length; i < len; i++){
                    var _d = _dom[i];
                    for(var j in params){
                        switch(j){
                            case "ease":
                            case "delay":
                            case 'onComplete':
                                break;
                            default:
                                _d.style[j] = typeof(params[j]) === 'number' ? params[j] + 'px' : params[j];
                                break;
                        }
                    }
                    waitHandler(function(){
                        _self._tween(_d, duration, params2);
                    });
                }
            }else{
                for(var j in params){
                    switch(j){
                        case "ease":
                        case "delay":
                        case 'onComplete':
                            break;
                        default:
                            _dom.style[j] = typeof(params[j]) === 'number' ? params[j] + 'px' : params[j];
                            break;
                    }
                }
                waitHandler(function(){
                    _self._tween(_dom, duration, params2);
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

            var _dom = this._getElement(dom);

            if(_dom.length){
                for(var i = 0, len = _dom.length; i < len; i++){
                    for(var j in _endEvents){
                        this._removeEventHandler(_dom[i], _endEvents[j]);
                    }
                    _dom[i].style[_browserPrefix + "Transition"] = 'none';
                }
            }else{
                for(var j in _endEvents){
                    this._removeEventHandler(_dom, _endEvents[j]);
                }
                _dom.style[_browserPrefix + "Transition"] = 'none';
            }
        },

        _getElement: function(obj){
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
        },

        _tween:function(dom, duration, params){
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
                            this._addEventHandler(_dom, _endEvents[j], this._endHandler, {dom:_dom, fun:params[i]});
                        }
                        break;
                }
            }

            _dom.style[_browserPrefix + "Transition"] = 'all ' + _duration + ' ' + _ease + ' ' + _delay;

            waitHandler(function(){
                for(var i in params){
                    switch(i){
                        case "ease":
                        case "delay":
                        case 'onComplete':
                            break;
                        default:
                            _dom.style[i] = typeof(params[i]) === 'number' ? params[i] + 'px' : params[i];
                            break;
                    }
                }
            });
        },

        _endHandler:function(obj){
            obj.dom.style[_browserPrefix + "Transition"] = 'none';
            for(var j in _endEvents){
                CTL._removeEventHandler(obj.dom, _endEvents[j]);
            }
            obj.fun();
        },

        _addEventHandler:function (obj, eventName, fun, param){
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
        },

        _removeEventHandler:function (obj, eventName) {
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

    });

    return CTL;
}));
