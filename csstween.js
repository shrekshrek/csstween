/*!
 * VERSION: 0.2.0
 * DATE: 2015-03-11
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

    CT.VERSION = '0.2.0';

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

    // --------------------------------------------------------------------检测是否支持,辅助公用方法
    var _isSupported;
    var _browserPrefix = '';
    var _startEvent = 'animationstart';
    var _iterationEvent = 'animationiteration';
    var _endEvent = 'animationend';

    CT.extend({
        checkSupport:function(){
            if(_isSupported !== undefined) return _isSupported;

            var _d = document.createElement('div');
            var _prefixes = ['', 'Webkit', 'Moz', 'O', 'Ms'];

            for (var i in _prefixes) {
                if ((_prefixes[i] + 'Animation') in _d.style) {
                    _isSupported = true;
                    _browserPrefix = _prefixes[i];
                    if(!(_browserPrefix === '' || _browserPrefix === 'Moz')){
                        _startEvent = _browserPrefix.toLowerCase() + 'Animationstart';
                        _iterationEvent = _browserPrefix.toLowerCase() + 'Animationiteration';
                        _endEvent = _browserPrefix.toLowerCase() + 'AnimationEnd';
                    }

                    _initKeyframesStyle();

                    return true;
                }
            }
            return false;
        },

        browserPrefix:function(str){
            if (arguments.length) {
                return _browserPrefix + str;
            } else {
                return _browserPrefix;
            }
        },

        hyphenize:function(str){
            return str.replace( /([A-Z])/g, "-$1" ).toLowerCase();
        },

        camelize:function(str){
            return str.replace(/\-(\w)/g, function(all, letter){
                return letter.toUpperCase();
            });
        }

    });

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




    // --------------------------------------------------------------------css rule 相关函数
    var _keyframesRule = window.CSSRule.KEYFRAMES_RULE || window.CSSRule.WEBKIT_KEYFRAMES_RULE || window.CSSRule.MOZ_KEYFRAMES_RULE;
    var _kfsSheet;
    var _kfsRules;
    var _kfsId = 0;
    function _initKeyframesStyle(){
        var _style = document.createElement('style');
        _style.rel = 'stylesheet';
        _style.type = 'text/css';
        document.getElementsByTagName('head')[0].appendChild(_style);
        _kfsSheet = _style.sheet;
        _kfsRules = _kfsSheet.cssRules || _kfsSheet.rules || [];
    }

    function _getKeyframe(name){
        for(var i in _kfsRules){
            var _rule = _kfsRules[i];
            if(_rule.type === _keyframesRule && _rule.name === name){
                return {rule:_rule, index:i};
            }
        }
        return null;
    }

    function _addKeyFrames(name, fromParams, toParams) {
        var _index = _kfsRules.length;
        var _name = 'kfs' + name;
        var _text = '0%{' + _concatParam(fromParams) + '}' + '100%{' + _concatParam(toParams) + '}';

        if (_kfsSheet.insertRule) {
            _kfsSheet.insertRule('@' + CT.hyphenize(CT.browserPrefix('Keyframes'))+ ' ' + _name + "{" + _text + "}", _index);
        } else if (_kfsSheet.addRule) {
            _kfsSheet.addRule('@' + CT.hyphenize(CT.browserPrefix('Keyframes')) + ' ' + _name, _text, _index);
        }
        return _name;
    }

    function _concatParam(params){
        var _text = '';
        for(var i in params){
            switch(i){
                case 'transform':
                    _text += CT.hyphenize(CT.browserPrefix('Transform')) + ':' + params[i] + ';';
                    break;
                default:
                    _text += CT.hyphenize(i) + ':' + params[i] + ';';
                    break;
            }
        }
        return _text;
    }

    function _removeKeyFrames(name) {
        var _obj = _getKeyframe(name);
        if(_obj === null) return;

        if (_kfsSheet.deleteRule) {
            _kfsSheet.deleteRule(_obj.index);
        } else if (_kfsSheet.removeRule) {
            _kfsSheet.removeRule(_obj.index);
        }
    }



    // --------------------------------------------------------------------功能主体
    var _handlers = {};
    var _handlerId = 0;
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

        var _fromParams = {};
        for(var j in fromParams){
            var _name = CT.camelize(j);
            if(_dom.style[_name] !== undefined) _fromParams[_name] = fromParams[j];
        }

        var _toParams = {};
        var _duration = duration + 's';
        var _ease = 'cubic-bezier(0, 0, 1, 1)';
        var _delay = '0s';
        var _iteration = 1;
        var _direction = 'normal';
        var _callback = '';
        var _callbackParams = [];
        for(var i in toParams){
            switch(i){
                case 'repeat':
                    if(toParams[i] === -1) _iteration = 'infinite';
                    else _iteration = toParams[i];
                    break;
                case 'yoyo':
                    if(toParams[i]) _direction = 'alternate';
                    break;
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
                default:
                    var _name = CT.camelize(i);
                    if(_dom.style[_name] !== undefined) _toParams[_name] = toParams[i];
                    break;
            }
        }

        var _kfsName = _addKeyFrames(++_kfsId, _fromParams, _toParams);
        _addEventHandler(_dom, _endEvent, _endHandler, {dom:_dom, callback:_callback, params:_callbackParams}, _kfsName);
        _dom.style[CT.browserPrefix('Animation')] = _kfsName + ' ' + _duration + ' ' + _ease + ' ' + _delay + ' ' + _iteration + ' ' + _direction;
        _setStyle(_dom, _toParams);

    }

    function _endHandler(obj){
        obj.dom.style[CT.browserPrefix('Animation')] = 'none';
        _removeEventHandler(obj.dom, _endEvent);
        obj.callback.apply(obj.dom, obj.params);
    }

    function _getStyle(dom, param){
        var _dom = dom;
        var _param = '';
        switch(param){
            case 'transform':
                _param = CT.browserPrefix('Transform');
                break;
            default:
                _param = CT.camelize(param);
                break;
        }

        if(_dom.style[_param]){
            return _dom.style[_param];
        }else if(_dom.currentStyle){
            return _dom.currentStyle[_param];
        }else if(document.defaultView && document.defaultView.getComputedStyle){
            var _p = CT.hyphenize(_param);
            var _s = document.defaultView.getComputedStyle(_dom,'');
            return _s && _s.getPropertyValue(_p);
        }else{
            return null;
        }
    }

    function _setStyle(dom, params){
        var _dom = dom;
        for(var i in params){
            _dom.style[i] = params[i];
        }
    }

    function _addEventHandler(dom, eventName, fun, param, kfs){
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
        _handlers[dom._ct_hid].push({dom:dom, event:eventName, handler:_fun, callback:fun, kfs:kfs});
    }

    function _removeEventHandler(dom, eventName) {
        if(!dom._ct_hid) return;
        var _h = _handlers[dom._ct_hid];
        for(var i = _h.length - 1; i >= 0; i--){
            if(_h[i].event === eventName){

                _removeKeyFrames(_h[i].kfs);

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
                for(var j in toParams){
                    if(_d.style[j] !== undefined){
                        _fromParams[j] = _getStyle(_d, j);
                    }else{
                        _fromParams[j] = toParams[j];
                    }
                }
                _tween(_d, duration, _fromParams, toParams);
            }
        },

        kill: function(target){
            var _dom = _getElement(target);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                _d.style[CT.browserPrefix('Animation')] = 'none';
                _removeEventHandler(_d, _endEvent);
            }
        },

        killAll: function(){
            for(var i in _handlers){
                var _a = _handlers[i];
                for(var j in _a){
                    var _d = _a[j].dom;
                    this.kill(_d, _endEvent);
                }
            }
        }

    });

    return CT;
}));
