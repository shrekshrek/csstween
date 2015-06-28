/*!
 * VERSION: 0.4.0
 * DATE: 2015-05-19
 * GIT:https://github.com/shrekshrek/csstween
 *
 * @author: Shrek.wang, shrekshrek@gmail.com
 **/

(function(factory) {
    var root = (typeof self == 'object' && self.self == self && self) ||
        (typeof global == 'object' && global.global == global && global);

    if (typeof define === 'function' && define.amd) {
        define(['exports'], function(exports) {
            root.CT = factory(root, exports);
        });
    } else if (typeof exports !== 'undefined') {
        factory(root, exports);
    } else {
        root.CT = factory(root, {});
    }

}(function(root, CT) {
    var previousCssTween = root.CT;

    CT.VERSION = '0.4.0';

    CT.noConflict = function() {
        root.CT = previousCssTween;
        return this;
    };

    // --------------------------------------------------------------------辅助方法
    function extend(obj, obj2) {
        for (var prop in obj2) {
            obj[prop] = obj2[prop];
        }
    }

    function each(obj, callback) {
        if(obj.length === undefined){
            callback.call(obj, 0, obj);
        }else{
            for (var i = 0; i < obj.length; i++){
                callback.call(obj[i], i, obj[i]);
            }
        }
    }

    //  WebkitTransform 转 -webkit-transform
    function hyphenize(str){
        return str.replace(/([A-Z])/g, "-$1").toLowerCase();
    }

    //  -webkit-transform 转 WebkitTransform
    function camelize(str){
        return str.replace(/\-(\w)/g, function(all, letter){
            return letter.toUpperCase();
        });
    }

    //  transformOrigin 转 TransformOrigin
    function firstUper(str){
        return str.replace(/\b(\w)|\s(\w)/g, function(m){
            return m.toUpperCase();
        });
    }

    function objct2array(obj){
        var _a = [];
        for(var i in obj){
            _a[i] = obj[i];
        }
        return _a;
    }

    // --------------------------------------------------------------------检测是否支持,浏览器补全方法
    var isSupported;
    var prefix = '';

    var START_EVENT = 'animationstart';
    var ITERATION_EVENT = 'animationiteration';
    var END_EVENT = 'animationend';

    function checkSupport(){
        if(isSupported !== undefined) return isSupported;

        var _d = document.createElement('div');
        var _prefixes = ['', 'Webkit', 'Moz', 'O'];

        for (var i in _prefixes) {
            if ((_prefixes[i] + 'Animation') in _d.style) {
                isSupported = true;
                prefix = _prefixes[i];
                if(!(prefix === '' || prefix === 'Moz')){
                    START_EVENT = prefix.toLowerCase() + 'Animationstart';
                    ITERATION_EVENT = prefix.toLowerCase() + 'Animationiteration';
                    END_EVENT = prefix.toLowerCase() + 'AnimationEnd';
                }

                initCtStyle();

                return true;
            }
        }
        return false;
    }

    function browserPrefix(str){
        if (str) {
            return prefix + firstUper(str);
        } else {
            return prefix;
        }
    }


    // --------------------------------------------------------------------css rule 相关函数
    var keyframesRule = window.CSSRule.KEYFRAMES_RULE || window.CSSRule.WEBKIT_KEYFRAMES_RULE || window.CSSRule.MOZ_KEYFRAMES_RULE;
    var styleRule = window.CSSRule.STYLE_RULE || window.CSSRule.WEBKIT_STYLE_RULE || window.CSSRule.MOZ_STYLE_RULE;
    var ctSheet;
    var ctRules;
    var ctId = 0;

    function initCtStyle(){
        var _style = document.createElement('style');
        _style.rel = 'stylesheet';
        _style.type = 'text/css';
        document.getElementsByTagName('head')[0].appendChild(_style);
        ctSheet = _style.sheet;
        ctRules = ctSheet.cssRules || ctSheet.rules || [];

    }

    function getRule(name){
        for(var i in ctRules){
            var _rule = ctRules[i];
            if((_rule.type === keyframesRule && _rule.name === name) || (_rule.type === styleRule && _rule.selectorText === name)){
                return {rule:_rule, index:i};
            }
        }
        return null;
    }

    function addRule(ruleName, ruleTxt){
        var _index = ctRules.length;
        if (ctSheet.insertRule) {
            ctSheet.insertRule(ruleName + '{' + ruleTxt + '}', _index);
        } else if (ctSheet.addRule) {
            ctSheet.addRule(ruleName, ruleTxt, _index);
        }
    }

    function removeRule(name) {
        var _obj = getRule(name);
        if(_obj === null) return;

        if (ctSheet.deleteRule) {
            ctSheet.deleteRule(_obj.index);
        } else if (ctSheet.removeRule) {
            ctSheet.removeRule(_obj.index);
        }
    }

    function concatParam(params){
        var _text = '';
        for(var i in params){
            if(i !== 'key') _text += hyphenize(i) + ':' + params[i] + ';';
        }
        return _text;
    }

    function addKfsRule(name, keys) {
        var _name = 'ct_kfs_' + name;
        var _text = '';
        var _len = keys.length;
        for(var i in keys){
            var _key;
            if(keys[i].key !== undefined) _key = keys[i].key;
            else _key = Math.floor(i/(_len-1)*100);
            _text += _key + '%{' + concatParam(keys[i]) + '}';
        }
        addRule('@' + hyphenize(browserPrefix('Keyframes'))+ ' ' + _name, _text);
        return _name;
    }

    function addAnimRule(name, txt) {
        var _name = 'ct_anim_' + name;
        var _text = hyphenize(browserPrefix('Animation'))+ ':' + txt + ";";
        _text += hyphenize(browserPrefix('AnimationFillMode'))+ ':' + 'both' + ";";
        addRule('.' + _name, _text);
        return _name;
    }

    function addPauseRule(name) {
        var _name = 'ct_pause_'+name;
        var _text = hyphenize(browserPrefix('AnimationPlayState'))+ ':' + 'paused' + ";";
        addRule('.' + _name, _text);
        return _name;
    }


    // --------------------------------------------------------------------class 相关函数
    function hasClass( dom, className ){
        return !!dom.className.match(new RegExp("(\\s|^)" + className));
    }

    function addClass( dom, className ){
        if( !hasClass( dom, className ) ){
            dom.className += " " + className;
        }
    }

    function removeClass( dom, className ){
        dom.className = dom.className.replace(new RegExp("(\\s|^)" + className),"");
    }


    // --------------------------------------------------------------------功能主体
    var tweens = {};
    var tweenId = 0;

    function createTweenId(){
        return 'ct_tween_' + (++tweenId);
    }

    function addTweenId(dom, id){
        if(dom._ct_tId){
            killTween(dom._ct_tId);
        }
        dom._ct_tId = id;
    }

    function removeTweenId(dom, id){
        if(dom._ct_tId === id)
            delete dom._ct_tId;
    }

    function getElement(dom){
        if (!(isSupported || checkSupport())) {
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
        if(typeof(arguments[1]) !== 'number') throw 'Second param need a number!!!';

        var _dom = arguments[0];
        var _tweenId = createTweenId();
        addTweenId(_dom, _tweenId);

        var _len = arguments.length;
        var _keys = [];
        for(var k = 2; k < _len - 1; k++){
            var _obj = {};
            var _obj2 = arguments[k];
            for(var j in _obj2){
                switch(j){
                    case 'key':
                        _obj[j] = _obj2[j];
                        break;
                    default:
                        var _name = checkCssName(_dom, j);
                        if(_name) _obj[_name] = checkCssValue(_dom, _name, _obj2[j]);
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
                    _toParams[i] = toParams[i];
                    break;
                default:
                    var _name = checkCssName(_dom, i);
                    if(_name) _toParams[_name] = checkCssValue(_dom, _name, toParams[i]);
                    break;
            }
        }
        _keys.push(_toParams);

        var _obj = {};
        var _id = ++ctId;
        var _kfsName = addKfsRule(_id, _keys);
        var _animName = addAnimRule(_id, _kfsName + ' ' + _duration + ' ' + _ease + ' ' + _delay + ' ' + _iteration + ' ' + _direction);
        var _pauseName = addPauseRule(_id);

        _obj.dom = _dom;
        _obj.keyframes = _kfsName;
        _obj.anim = _animName;
        _obj.pause = _pauseName;
        _obj.css = _iteration%2===0?_keys[0]:_toParams;

        _obj[START_EVENT] = addEventHandler(_dom, START_EVENT, startHandler, {callback:_startCallback, params:_startCallbackParams});
        _obj[ITERATION_EVENT] = addEventHandler(_dom, ITERATION_EVENT, iterationHandler, {callback:_iterationCallback, params:_iterationCallbackParams});
        _obj[END_EVENT] = addEventHandler(_dom, END_EVENT, endHandler, {callback:_endCallback, params:_endCallbackParams, id:_tweenId});

        addClass(_dom, _animName);
        tweens[_tweenId] = _obj;
    }

    function killTween(id, end){
        var _obj = tweens[id];
        if(end === undefined)
            end = false;

        pauseTween(_obj);
        resumeTween(_obj);

        removeEventHandler(_obj.dom, START_EVENT, _obj[START_EVENT].handler);
        removeEventHandler(_obj.dom, ITERATION_EVENT, _obj[ITERATION_EVENT].handler);
        removeEventHandler(_obj.dom, END_EVENT, _obj[END_EVENT].handler);

        if(end){
            setStyle(_obj.dom, _obj.css);
            if(_obj[END_EVENT].params.callback)
                _obj[END_EVENT].params.callback.apply(_obj.dom, _obj[END_EVENT].params.params);
        }else{
            for(var i in _obj.css){
                _obj.dom.style[i] = getStyle(_obj.dom, i);
            }
        }
        removeClass(_obj.dom, _obj.anim);
        removeRule(_obj.keyframes);
        removeRule('.'+_obj.anim);
        removeRule('.'+_obj.pause);

        removeTweenId(_obj.dom, id);

        delete tweens[id];
    }

    var needFixCssNames = ['transform','transformOrigin','transformStyle','perspective','perspectiveOrigin','backfaceVisibility','transition'];
    function checkCssName(dom, cssName){
        //var _name = camelize(cssName);
        var _name = cssName;
        for(var i in needFixCssNames){
            if(_name === needFixCssNames[i]){
                _name = browserPrefix(_name);
            }
        }

        if(dom.style[_name] !== undefined){
            return _name;
        }else{
            return null;
        }
    }

    var numberCssNames = ['fontWeight','lineHeight','opacity','zoom'];
    function checkCssValue(dom, cssName, cssValue){
        var _n = calcValue(dom, cssName, cssValue);
        for(var i in numberCssNames){
            if(cssName === numberCssNames[i]){
                return _n;
            }
        }
        return typeof(_n) === 'number'?_n + 'px':_n;
    }

    function calcValue(dom, cssName, cssValue){
        if(typeof(cssValue) === 'string'){
            var _s = cssValue.substr(0, 2);
            var _n = parseFloat(cssValue.substr(2));
            switch(_s){
                case '+=':
                    cssValue = parseFloat(getStyle(dom, cssName)) + _n;
                    break;
                case '-=':
                    cssValue = parseFloat(getStyle(dom, cssName)) - _n;
                    break;
                default:
                    break;
            }
        }
        return cssValue;
    }

    function startHandler(params){
        if(params.callback)
            params.callback.apply(this, params.params);
    }

    function iterationHandler(params){
        if(params.callback)
            params.callback.apply(this, params.params);
    }

    function endHandler(params){
        killTween(params.id, true);
    }

    function addEventHandler(dom, eventName, handler, params){
        var _handler = function(){
            handler.apply(dom, [params]);
        };

        if(dom.addEventListener){
            dom.addEventListener(eventName, _handler, false);
        }else if(dom.attachEvent){
            dom.attachEvent('on' + eventName, _handler);
        }else{
            dom['on' + eventName] = _handler;
        }

        return {handler:_handler, params:params};
    }

    function removeEventHandler(dom, eventName, handler) {
        if (dom.removeEventListener) {
            dom.removeEventListener(eventName, handler);
        }else if (dom.detachEvent){
            dom.detachEvent('on' + eventName, handler);
        }else{
            delete dom['on' + eventName];
        }
    }

    function getStyle(dom, param){
        var _dom = dom;
        var _name = checkCssName(dom, param);
        if(_name === null) throw "css name is wrong!!!";

        //if(_dom.style[_name]){
        //    return _dom.style[_name];
        //}else
        if(document.defaultView && document.defaultView.getComputedStyle){
            var _p = hyphenize(_name);
            var _s = document.defaultView.getComputedStyle(_dom,'');
            return _s && _s.getPropertyValue(_p);
        }else if(_dom.currentStyle){
            return _dom.currentStyle[_name];
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

    function pauseTween(tweenObj){
        var _obj = tweenObj;
        addClass(_obj.dom, _obj.pause);
    }

    function resumeTween(tweenObj){
        var _obj = tweenObj;
        removeClass(_obj.dom, _obj.pause);
    }


    // --------------------------------------------------------------------主要方法
    extend(CT, {
        get: function(target, param){
            if(arguments.length > 2){
                throw 'The number of parameters is too much!';
            }
            var _dom = getElement(target);
            return getStyle(_dom[0], param);
        },

        set: function(target, params){
            if(arguments.length > 2){
                throw 'The number of parameters is too much!';
            }
            var _dom = getElement(target);
            each(_dom, function(index, obj){
                var _params = {};
                for(var j in params){
                    var _name = checkCssName(obj, j);
                    if(_name) _params[_name] = checkCssValue(obj, _name, params[j]);
                }
                setStyle(obj, _params);
            });
        },

        fromTo: function(){
            if(arguments.length < 4){
                throw 'The number of parameters is not enough!';
            }
            var args = arguments;
            var _dom = getElement(args[0]);
            each(_dom, function(index, obj){
                var _a = objct2array(args);
                _a[0] = obj;
                tween.apply(this, _a);
            });
        },

        from: function(){
            if(arguments.length < 3){
                throw 'The number of parameters is not enough!';
            }
            var args = arguments;
            var _dom = getElement(args[0]);
            each(_dom, function(index, obj){
                var _fromParams = args[args.length - 1];
                var _toParams = {};
                for(var j in _fromParams){
                    var _name = checkCssName(obj, j);
                    if(_name){
                        _toParams[j] = getStyle(obj, j);
                    }else{
                        _toParams[j] = _fromParams[j];
                    }
                }
                var _a = objct2array(args);
                _a[0] = obj;
                _a.push(_toParams);
                tween.apply(this, _a);
            });
        },

        to: function(){
            if(arguments.length < 3){
                throw 'The number of parameters is not enough!';
            }
            var args = arguments;
            var _dom = getElement(args[0]);
            each(_dom, function(index, obj){
                var _fromParams = {};
                var _toParams = args[args.length - 1];
                for(var j in _toParams){
                    var _name = checkCssName(obj, j);
                    if(_name){
                        _fromParams[j] = getStyle(obj, j);
                    }else{
                        _fromParams[j] = _toParams[j];
                    }
                }

                var _a = objct2array(args);
                _a[0] = obj;
                _a.splice(2, 0, _fromParams);
                tween.apply(this, _a);
            });
        },

        kill: function(target, end){
            var _dom = getElement(target);
            each(_dom, function(index, obj){
                if(obj._ct_tId){
                    killTween(obj._ct_tId, end);
                }
            });
        },

        killAll: function(end){
            for(var i in tweens){
                killTween(i, end);
            }
        },

        pause: function(target){
            var _dom = getElement(target);
            each(_dom, function(index, obj){
                if(obj._ct_tId){
                    pauseTween(tweens[obj._ct_tId]);
                }
            });
        },

        pauseAll: function(){
            for(var i in tweens){
                pauseTween(tweens[i]);
            }
        },

        resume: function(target){
            var _dom = getElement(target);
            each(_dom, function(index, obj){
                if(obj._ct_tId){
                    resumeTween(tweens[obj._ct_tId]);
                }
            });
        },

        resumeAll: function(){
            for(var i in tweens){
                resumeTween(tweens[i]);
            }
        }

    });

    // --------------------------------------------------------------------缓动选项
    extend(CT, {
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

    return CT;
}));
