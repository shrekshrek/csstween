/*!
 * VERSION: 0.1.0
 * DATE: 2015-01-09
 * GIT:https://github.com/shrekshrek/css3animation
 *
 * @author: Shrek.wang, shrekshrek@gmail.com
 **/

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports'], function(exports) {
            root.CssTween = factory(root, exports);
        });
    } else if (typeof exports !== 'undefined') {
        factory(root, exports);
    } else {
        root.CssTween = factory(root, {});
    }

}(this, function(root, CssTween) {

    var previousCssTweeen = root.CssTween;

    CssTween.VERSION = '0.1.0';

    CssTween.noConflict = function() {
        root.CssTween = previousCssTweeen;
        return this;
    };

    // --------------------------------------------------------------------extend
    CssTween.extend = function(obj) {
        for (var prop in obj) {
            CssTween[prop] = obj[prop];
        }
    };


    // --------------------------------------------------------------------全局属性
    CssTween._isSupported = false;
    CssTween._browserPrefix = "webkit";

    CssTween.checkSupport = function() {
        var _d = document.createElement("div"), _prefixes = ["", "webkit", "Moz", "O", "ms"], _len = _prefixes.length, i;

        for ( i = 0; i < _len; i++) {
            if ((_prefixes[i] + "Animation") in _d.style) {
                CssTween._isSupported = true;
                CssTween._browserPrefix = _prefixes[i];
                return true;
            }
        }
        return false;
    };

    CssTween.browserPrefix = function(str) {
        if (arguments.length) {
            return CssTween._browserPrefix + str;
        } else {
            return CssTween._browserPrefix;
        }
    };

    // --------------------------------------------------------------------辅助方法
    CssTween.animations = {};
    CssTween.extend({
        from: function(dom, duration, params){
            if (!(this._isSupported || this.checkSupport())) {
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
                    var _params = {};
                    for(var j in params){
                        switch(j){
                            case "ease":
                            case "delay":
                            case 'onComplete':
                                _params[j] = params[j];
                                break;
                            default:
                                _params[j] = _dom[i].style[j];
                                _dom[i].style[j] = typeof(params[j]) === 'number' ? params[j] + 'px' : params[j];
                                break;
                        }
                    }
                    this._tween(_dom[i], duration, _params);
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
                this._tween(_dom, duration, _params);
            }
        },

        to: function(dom, duration, params){
            if (!(this._isSupported || this.checkSupport())) {
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
            if (!(this._isSupported || this.checkSupport())) {
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
                    setTimeout(function(){
                        _self._tween(_d, duration, params2);
                    },0);
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
                setTimeout(function(){
                    _self._tween(_dom, duration, params2);
                },0);
            }
        },

        kill: function(dom){
            if (!(this._isSupported || this.checkSupport())) {
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
                    this._removeEventHandler(_dom[i], 'transitionend');
                    this._removeEventHandler(_dom[i], 'webkitTransitionEnd');
                    this._removeEventHandler(_dom[i], 'oTransitionEnd');
                    _dom[i].style[this._browserPrefix + "Transition"] = 'none';
                    //_dom[i].style['marginTop'] = '300px';
                }
            }else{
                this._removeEventHandler(_dom, 'transitionend');
                this._removeEventHandler(_dom, 'webkitTransitionEnd');
                this._removeEventHandler(_dom, 'oTransitionEnd');
                _dom.style[this._browserPrefix + "Transition"] = 'none';
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
                        switch(params[i]){
                            case 'strong':
                                _ease = 'cubic-bezier(0.5, 0, 0.5, 1)';
                                break;
                            case 'linear':
                            default:
                                _ease = 'cubic-bezier(0, 0, 1, 1)';
                                break;
                        }
                        break;
                    case "delay":
                        _delay = params[i] + 's';
                        break;
                    case 'onComplete':
                        this._addEventHandler(_dom, 'transitionend', this._endHandler, {dom:_dom, fun:params[i]});
                        this._addEventHandler(_dom, 'webkitTransitionEnd', this._endHandler, {dom:_dom, fun:params[i]});
                        this._addEventHandler(_dom, 'oTransitionEnd', this._endHandler, {dom:_dom, fun:params[i]});
                        break;
                }
            }

            _dom.style[this._browserPrefix + "Transition"] = 'all ' + _duration + ' ' + _ease + ' ' + _delay;

            setTimeout(function(){
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
            }, 0);
        },

        _endHandler:function(obj){
            obj.dom.style[this._browserPrefix + "Transition"] = 'none';
            CssTween._removeEventHandler(obj.dom, 'transitionend');
            CssTween._removeEventHandler(obj.dom, 'webkitTransitionEnd');
            CssTween._removeEventHandler(obj.dom, 'oTransitionEnd');
            obj.fun();
        },

        _handlers:{},
        _handlerId:0,
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
                obj._ct_hid = ++this._handlerId;
            }
            if(!this._handlers[obj._ct_hid]){
                this._handlers[obj._ct_hid] = [];
            }
            this._handlers[obj._ct_hid].push({event:eventName, handler:_fun});
        },

        _removeEventHandler:function (obj, eventName, fun) {
            if(!obj._ct_hid) return;
            var _handlers = this._handlers[obj._ct_hid];
            var _fun = fun;
            for(var i = _handlers.length - 1; i >= 0; i--){
                if(_handlers[i].event === eventName){
                    _fun = _handlers[i].handler;
                    if (obj.removeEventListener) {
                        obj.removeEventListener(eventName, _fun);
                    }else if (obj.detachEvent){
                        obj.detachEvent("on" + eventName, _fun);
                    }else{
                        delete obj["on" + eventName];
                    }
                    _handlers.splice(i,1);
                }
            }
        }

    });

    return CssTween;
}));
