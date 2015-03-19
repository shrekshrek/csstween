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
    var startEvent = 'animationstart';
    var iterationEvent = 'animationiteration';
    var endEvent = 'animationend';

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
                        startEvent = _browserPrefix.toLowerCase() + 'Animationstart';
                        iterationEvent = _browserPrefix.toLowerCase() + 'Animationiteration';
                        endEvent = _browserPrefix.toLowerCase() + 'AnimationEnd';
                    }

                    initKeyframesStyle();

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
    function initKeyframesStyle(){
        var _style = document.createElement('style');
        _style.rel = 'stylesheet';
        _style.type = 'text/css';
        document.getElementsByTagName('head')[0].appendChild(_style);
        _kfsSheet = _style.sheet;
        _kfsRules = _kfsSheet.cssRules || _kfsSheet.rules || [];
    }

    function getKeyframe(name){
        for(var i in _kfsRules){
            var _rule = _kfsRules[i];
            if(_rule.type === _keyframesRule && _rule.name === name){
                return {rule:_rule, index:i};
            }
        }
        return null;
    }

    function addKeyFrames(name, keys) {
        var _index = _kfsRules.length;
        var _name = 'kfs' + name;
        var _text = '';
        var _len = keys.length;
        for(var i in keys){
            var _key;
            if(keys[i].key !== undefined) _key = keys[i].key;
            else _key = Math.floor(i/(_len-1)*100);
            _text += _key + '%{' + concatParam(keys[i]) + '}';
        }

        if (_kfsSheet.insertRule) {
            _kfsSheet.insertRule('@' + CT.hyphenize(CT.browserPrefix('Keyframes'))+ ' ' + _name + "{" + _text + "}", _index);
        } else if (_kfsSheet.addRule) {
            _kfsSheet.addRule('@' + CT.hyphenize(CT.browserPrefix('Keyframes')) + ' ' + _name, _text, _index);
        }
        return _name;
    }

    function concatParam(params){
        var _text = '';
        for(var i in params){
            if(i !== 'key') _text += CT.hyphenize(i) + ':' + params[i] + ';';
        }
        return _text;
    }

    function removeKeyFrames(name) {
        var _obj = getKeyframe(name);
        if(_obj === null) return;

        if (_kfsSheet.deleteRule) {
            _kfsSheet.deleteRule(_obj.index);
        } else if (_kfsSheet.removeRule) {
            _kfsSheet.removeRule(_obj.index);
        }
    }


    // --------------------------------------------------------------------功能主体
    var events = {};
    var eventId = 0;
    function getElement(dom){
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

    function tween(){
        var _dom = arguments[0];

        var _len = arguments.length;
        var _keys = [];
        for(var k = 2; k < _len-1; k++){
            var _obj = {};
            var _obj2 = arguments[k];
            for(var j in _obj2){
                switch(j){
                    case 'key':
                        _obj[j] = _obj2[j]
                        break;
                    default:
                        var _name = checkCssName(_dom, j);
                        if(_name) _obj[_name] = _obj2[j];
                        break;
                }
            }
            _keys.push(_obj);
        }

        var toParams = arguments[_len - 1];
        var _toParams = {};
        var _duration = arguments[1] + 's';
        var _ease = 'cubic-bezier(0, 0, 1, 1)';
        var _delay = '0s';
        var _iteration = 1;
        var _direction = 'normal';

        var _startCallback;
        var _startCallbackParams;
        var _iterationCallback;
        var _iterationCallbackParams;
        var _endCallback;
        var _endCallbackParams;

        for(var i in toParams){
            switch(i){
                case 'ease':
                    _ease = 'cubic-bezier' + toParams[i];
                    break;
                case 'repeat':
                    if(toParams[i] === -1) _iteration = 'infinite';
                    else _iteration = toParams[i];
                    break;
                case 'yoyo':
                    if(toParams[i]) _direction = 'alternate';
                    break;
                case 'delay':
                    _delay = toParams[i] + 's';
                    break;
                case 'onStart':
                    _startCallback = toParams[i];
                    break;
                case 'onStartParams':
                    _startCallbackParams = toParams[i];
                    break;
                case 'onIteration':
                    _iterationCallback = toParams[i];
                    break;
                case 'onIterationParams':
                    _iterationCallbackParams = toParams[i];
                    break;
                case 'onEnd':
                    _endCallback = toParams[i];
                    break;
                case 'onEndParams':
                    _endCallbackParams = toParams[i];
                    break;
                case 'key':
                    _toParams[i] = toParams[i]
                    break;
                default:
                    var _name = checkCssName(_dom, i);
                    if(_name) _toParams[_name] = toParams[i];
                    break;
            }
        }

        _keys.push(_toParams);
        var _kfsName = addKeyFrames(++_kfsId, _keys);

        addEventHandler(_dom, startEvent, startHandler, {dom:_dom, callback:_startCallback, params:_startCallbackParams});
        addEventHandler(_dom, iterationEvent, iterationHandler, {dom:_dom, callback:_iterationCallback, params:_iterationCallbackParams});
        addEventHandler(_dom, endEvent, endHandler, {dom:_dom, callback:_endCallback, params:_endCallbackParams, kfs:_kfsName, css:_iteration%2===0?_keys[0]:_toParams});

        _dom.style[CT.browserPrefix('Animation')] = _kfsName + ' ' + _duration + ' ' + _ease + ' ' + _delay + ' ' + _iteration + ' ' + _direction;

    }

    function killTween(params){
        setStyle(params.dom, params.css);
        params.dom.style[CT.browserPrefix('Animation')] = 'none';
        removeKeyFrames(params.kfs);
        removeEventHandler(params.dom);
    }

    function checkCssName(dom, cssName){
        switch(cssName){
            case 'transform':
            case 'Transform':
                var _name = CT.browserPrefix('Transform');
                return _name;
                break;
            default:
                var _name = CT.camelize(cssName);
                if(dom.style[_name] !== undefined)
                    return _name;
                break;
        }
        return null;
    }

    function startHandler(params){
        if(params.callback)
            params.callback.apply(params.dom, params.params);
    }

    function iterationHandler(params){
        if(params.callback)
            params.callback.apply(params.dom, params.params);
    }

    function endHandler(params){
        killTween(params);

        if(params.callback)
            params.callback.apply(params.dom, params.params);
    }

    function addEventHandler(dom, eventName, handler, params){
        var _handler = function(){
            handler.apply(this, [params]);
        };

        if(dom.addEventListener){
            dom.addEventListener(eventName, _handler, false);
        }else if(dom.attachEvent){
            dom.attachEvent('on'+eventName, _handler);
        }else{
            dom['on' + eventName] = _handler;
        }

        if(!dom._ct_eid){
            dom._ct_eid = ++eventId;
        }
        if(!events[dom._ct_eid]){
            events[dom._ct_eid] = {};
        }
        events[dom._ct_eid][eventName] = {dom:dom, handler:_handler, params:params};
    }

    function removeEventHandler(dom) {
        if(!dom._ct_eid) return;
        var _e = events[dom._ct_eid];
        for(var i in _e){
            var _handler = _e[i].handler;
            if (dom.removeEventListener) {
                dom.removeEventListener(i, _handler);
            }else if (dom.detachEvent){
                dom.detachEvent('on' + i, _handler);
            }else{
                delete dom['on' + i];
            }
        }
        delete events[dom._ct_eid];
        delete dom._ct_eid;
    }

    function getStyle(dom, param){
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

    function setStyle(dom, params){
        var _dom = dom;
        for(var i in params){
            _dom.style[i] = params[i];
        }
    }

    function pauseTween(params){
        params.dom.style[CT.browserPrefix('AnimationPlayState')] = 'paused';
    }

    function resumeTween(params){
        params.dom.style[CT.browserPrefix('AnimationPlayState')] = 'running';
    }

    function objct2array(obj){
        var _a = [];
        for(var i in obj){
            _a[i] = obj[i];
        }
        return _a;
    }


    // --------------------------------------------------------------------主要方法
    CT.extend({
        get: function(target, param){
            var _dom = getElement(target);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                return getStyle(_d,param);
            }
        },

        set: function(target, params){
            var _dom = getElement(target);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                var _params = {};
                for(var j in params){
                    var _name = checkCssName(_d, j);
                    if(_name) _params[_name] = params[j];
                }
                setStyle(_d, params);
            }
        },

        fromTo: function(){
            if(arguments.length < 4){
                throw 'The number of parameters is not enough!';
            }
            var _dom = getElement(arguments[0]);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                if(_d._ct_eid) killTween(events[_d._ct_eid][endEvent].params);

                var _a = objct2array(arguments);
                _a[0] = _d;
                tween.apply(this, _a);
            }
        },

        from: function(){
            if(arguments.length < 3){
                throw 'The number of parameters is not enough!';
            }
            var _dom = getElement(arguments[0]);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                if(_d._ct_eid) killTween(events[_d._ct_eid][endEvent].params);

                var _fromParams = arguments[arguments.length - 1];
                var _toParams = {};
                for(var j in _fromParams){
                    if(_d.style[j] !== undefined){
                        _toParams[j] = getStyle(_d, j);
                    }else{
                        _toParams[j] = _fromParams[j];
                    }
                }

                var _a = objct2array(arguments);
                _a[0] = _d;
                _a.push(_toParams);
                tween.apply(this, _a);
            }
        },

        to: function(){
            if(arguments.length < 3){
                throw 'The number of parameters is not enough!';
            }
            var _dom = getElement(arguments[0]);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                if(_d._ct_eid) killTween(events[_d._ct_eid][endEvent].params);

                var _fromParams = {};
                var _toParams = arguments[arguments.length - 1];
                for(var j in _toParams){
                    if(_d.style[j] !== undefined){
                        _fromParams[j] = getStyle(_d, j);
                    }else{
                        _fromParams[j] = _toParams[j];
                    }
                }

                var _a = objct2array(arguments);
                _a[0] = _d;
                _a.splice(2, 0, _fromParams);
                tween.apply(this, _a);
            }
        },

        kill: function(target){
            var _dom = getElement(target);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                if(_d._ct_eid) killTween(events[_d._ct_eid][endEvent].params);
            }
        },

        killAll: function(){
            for(var i in events){
                var _p = events[i][endEvent];
                killTween(_p);
            }
        },

        pause: function(target){
            var _dom = getElement(target);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                if(_d._ct_eid) pauseTween(events[_d._ct_eid][endEvent]);
            }
        },

        pauseAll: function(){
            for(var i in events){
                var _p = events[i][endEvent];
                pauseTween(_p);
            }
        },

        resume: function(target){
            var _dom = getElement(target);
            if(_dom.length === undefined) _dom = [_dom];
            for(var i = 0, _len = _dom.length; i < _len; i++){
                var _d = _dom[i];
                if(_d._ct_eid) resumeTween(events[_d._ct_eid][endEvent]);
            }
        },

        resumeAll: function(){
            for(var i in events){
                var _p = events[i][endEvent];
                resumeTween(_p);
            }
        }

    });

    return CT;
}));
