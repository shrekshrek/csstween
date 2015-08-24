/*!
 * VERSION: 0.5.0
 * DATE: 2015-09-24
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

    CT.VERSION = '0.5.0';

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
    //function camelize(str){
    //    return str.replace(/\-(\w)/g, function(all, letter){
    //        return letter.toUpperCase();
    //    });
    //}

    //  transformOrigin 转 TransformOrigin
    function firstUpper(str){
        return str.replace(/\b(\w)|\s(\w)/g, function(m){
            return m.toUpperCase();
        });
    }

    //  TransformOrigin 转 transformOrigin
    //function firstLower(str){
    //    return str.replace(/\b(\w)|\s(\w)/g, function(m){
    //        return m.toLowerCase();
    //    });
    //}

    function objct2array(obj){
        var _a = [];
        for(var i in obj){
            _a[i] = obj[i];
        }
        return _a;
    }

    // --------------------------------------------------------------------检测是否支持,浏览器补全方法
    var prefix = '';

    var START_EVENT = 'animationstart';
    var ITERATION_EVENT = 'animationiteration';
    var END_EVENT = 'animationend';

    function initPrefix(){
        var _d = document.createElement('div');
        var _prefixes = ['Webkit', 'Moz', 'Ms', 'O'];

        for (var i in _prefixes) {
            if ((_prefixes[i] + 'Animation') in _d.style) {
                prefix = _prefixes[i];
                if(prefix !== 'Moz'){
                    START_EVENT = prefix.toLowerCase() + 'AnimationStart';
                    ITERATION_EVENT = prefix.toLowerCase() + 'AnimationIteration';
                    END_EVENT = prefix.toLowerCase() + 'AnimationEnd';
                }
                break;
            }
        }
    }

    function browserPrefix(str){
        if (str) {
            return prefix + firstUpper(str);
        } else {
            return prefix;
        }
    }


    // --------------------------------------------------------------------css rule 相关函数
    var keyframesRule = window.CSSRule.KEYFRAMES_RULE || window.CSSRule.WEBKIT_KEYFRAMES_RULE || window.CSSRule.MOZ_KEYFRAMES_RULE;
    var styleRule = window.CSSRule.STYLE_RULE || window.CSSRule.WEBKIT_STYLE_RULE || window.CSSRule.MOZ_STYLE_RULE;
    var ctSheet;
    var ctRules;
    var ruleId = 0;

    function createRuleId(){
        return ++ruleId;
    }

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
        var _name = 'ct_pause_' + name;
        var _text = hyphenize(browserPrefix('AnimationPlayState'))+ ':' + 'paused' + ";";
        addRule('.' + _name, _text);
        return _name;
    }


    // --------------------------------------------------------------------class 相关函数
    function hasClass( target, className ){
        return !!target.className.match(new RegExp("(\\s|^)" + className));
    }

    function addClass( target, className ){
        if( !hasClass( target, className ) ){
            target.className += " " + className;
        }
    }

    function removeClass( target, className ){
        target.className = target.className.replace(new RegExp("(\\s|^)" + className),"");
    }


    // --------------------------------------------------------------------style 相关函数
    function getElement(target){
        if(!target) throw "target is undefined, can't tween!!!";

        switch(typeof(target)){
            case 'string':
                return (typeof(document) === 'undefined') ? target : (document.querySelectorAll ? document.querySelectorAll(target) : document.getElementById((target.charAt(0) === '#') ? target.substr(1) : target));
                break;
            case 'object':
                return target;
                break;
            default :
                throw "target is undefined, can't tween!!!";
                break;
        }
    }

    function checkCssName(target, name){
        if(target.style[name] !== undefined){
            return name;
        }

        name = browserPrefix(name);
        if(target.style[name] !== undefined){
            return name;
        }

        return null;
    }

    function calcValue(value, value2){
        if(typeof(value2) === 'string'){
            var _s = value2.substr(0, 2);
            var _n = parseFloat(value2.substr(2));
            switch(_s){
                case '+=':
                    value2 = parseFloat(value) + _n;
                    break;
                case '-=':
                    value2 = parseFloat(value) - _n;
                    break;
                default:
                    break;
            }
        }
        return value2;
    }

    var numberCssNames = ['fontWeight','lineHeight','opacity','zoom'];
    function checkCssValue(name, value){
        for(var i in numberCssNames){
            if(name === numberCssNames[i]){
                return value;
            }
        }
        return typeof(value) === 'number'?value + 'px':value;
    }

    function getStyle(target, name){
        //if(target.style[name]){
        //    return target.style[name];
        //}else
        if(document.defaultView && document.defaultView.getComputedStyle){
            var _p = hyphenize(name);
            var _s = document.defaultView.getComputedStyle(target,'');
            return _s && _s.getPropertyValue(_p);
        }else if(target.currentStyle){
            return target.currentStyle[name];
        }else{
            return null;
        }
    }

    function setStyle(target, params){
        for(var i in params){
            target.style[i] = params[i];
        }
    }

    // --------------------------------------------------------------------tween
    var tweens = {};
    var tweenId = 0;

    function createTweenId(){
        return ++tweenId;
    }

    function tween(){
        this.init.apply(this, arguments);
    }

    extend(tween.prototype, {
        init: function(){
            var _args = arguments;

            var _vars = _args[3];
            var _len = _vars.length;
            var _lastVar = _vars[_len - 1];

            this.var0 = _args[2];
            this.target = _args[0];
            this.duration = _args[1];
            this.ease = 'cubic-bezier' + (_lastVar.ease || CT.Linear.None);
            this.repeat = _lastVar.repeat || 1;
            this.yoyo = _lastVar.yoyo || false;
            this.delay = _lastVar.delay || 0;
            this.onStart = _lastVar.onStart || null;
            this.onStartParams = _lastVar.onStartParams || [];
            this.onIteration = _lastVar.onIteration || null;
            this.onIterationParams = _lastVar.onIterationParams || [];
            this.onEnd = _lastVar.onEnd || null;
            this.onEndParams = _lastVar.onEndParams || [];
            this.isPlaying = _lastVar.isPlaying || true;

            var _tid = createTweenId();
            if(this.target._ct_tId){
                tweens[this.target._ct_tId].kill();
            }
            this.target._ct_tId = _tid;

            this.vars = [];
            var _var, i, j;
            for(i in _vars){
                _var = {};
                for(j in this.var0){
                    if(j === 'key'){
                        _var[j] = _vars[i][j];
                    }else{
                        _var[checkCssName(this.target, j)] = checkCssValue(j, calcValue(this.var0[j], _vars[i][j]));
                    }
                }
                this.vars.push(_var);
            }

            var _rid = createRuleId();
            this.kfsName = addKfsRule(_rid, this.vars);
            this.animName = addAnimRule(_rid, this.kfsName + ' ' + this.duration + 's ' + this.ease + ' ' + this.delay + 's ' + (this.repeat<0 ? 'infinite' : this.repeat) + ' ' + (this.yoyo ? 'alternate' : 'normal'));
            this.pauseName = addPauseRule(_rid);

            this.startHandler = addEventHandler(this.target, START_EVENT, startHandler.bind(this));
            this.iterationHandler = addEventHandler(this.target, ITERATION_EVENT, iterationHandler.bind(this));
            this.endHandler = addEventHandler(this.target, END_EVENT, endHandler.bind(this));

            addClass(this.target, this.animName);

            if(!this.isPlaying) this.pause();

            tweens[_tid] = this;
        },
        play: function(){
            removeClass(this.target, this.pauseName);
        },
        pause: function(){
            addClass(this.target, this.pauseName);
        },
        kill: function(end){
            this.pause();

            var _lastVar = this.vars[this.vars.length - 1];
            if(end){
                setStyle(this.target, _lastVar);
            }else{
                for(var i in _lastVar){
                    this.target.style[i] = getStyle(this.target, i);
                }
            }

            removeEventHandler(this.target, START_EVENT, this.startHandler);
            removeEventHandler(this.target, ITERATION_EVENT, this.iterationHandler);
            removeEventHandler(this.target, END_EVENT, this.endHandler);

            removeClass(this.target, this.animName);

            removeRule(this.kfsName);
            removeRule('.' + this.animName);
            removeRule('.' + this.pauseName);

            delete tweens[this.target._ct_tId];
            delete this.target._ct_tId;

            if(end){
                if(this.onEnd)
                    this.onEnd.apply(this.target, this.onEndParams);
            }

        }

    });

    function startHandler(){
        if(this.onStart)
            this.onStart.apply(this.target, this.onStartParams);
    }

    function iterationHandler(){
        if(this.onIteration)
            this.onIteration.apply(this.target, this.onIterationParams);
    }

    function endHandler(){
        this.kill(true);
    }

    function addEventHandler(target, eventName, handler){
        var _handler = function(){
            handler.call();
        };

        target.addEventListener(eventName, _handler, false);

        return _handler;
    }

    function removeEventHandler(target, eventName, handler) {
        target.removeEventListener(eventName, handler, false);
    }


    // --------------------------------------------------------------------主要方法
    extend(CT, {
        get: function(target, param){
            var _target = getElement(target);
            if(_target.length !== undefined){
                _target = _target[0];
            }

            var _name = checkCssName(_target, param);
            if(_name)
                return getStyle(_target, _name);
            else
                return null;
        },

        set: function(target, params){
            var _target = getElement(target);
            each(_target, function(index, obj){
                var _params = {};
                for(var j in params){
                    var _name = checkCssName(obj, j);
                    if(_name){
                        _params[_name] = checkCssValue(_name, calcValue(getStyle(obj, _name), params[j]))
                    }
                }
                setStyle(obj, _params);
            });
        },

        fromTo: function(){
            if(arguments.length < 4) throw 'The number of parameters is not enough!';

            var _args = objct2array(arguments);
            var _target = getElement(_args[0]);
            var _tweens = [];
            var _fromVars = _args[2];
            each(_target, function(index, obj){
                var _var0 = {};
                for(var i in _fromVars){
                    var _name = checkCssName(obj, i);
                    if(_name){
                        _var0[i] = getStyle(obj, _name);
                    }
                }

                var _tween = new tween(obj, _args[1], _var0, _args.slice(2));
                _tweens.push(_tween);
            });

            if(_tweens.length == 1){
                return _tweens[0];
            }else{
                return _tweens;
            }
        },

        from: function(){
            if(arguments.length < 3) throw 'The number of parameters is not enough!';

            var _args = objct2array(arguments);
            var _len = _args.length;
            var _target = getElement(_args[0]);
            var _tweens = [];
            var _fromVars = _args[2];
            each(_target, function(index, obj){
                var _var0 = {};
                var _var1 = {};
                for(var i in _fromVars){
                    var _name = checkCssName(obj, i);
                    if(_name){
                        _var1[i] = _var0[i] = getStyle(obj, _name);
                    }
                }

                var _toVars = _args[_len - 1];
                for(var j in _toVars){
                    if(_var1[j] == undefined){
                        _var1[j] = _toVars[j];
                    }
                }

                var _tween = new tween(obj, _args[1], _var0, _args.slice(2).concat(_var1));
                _tweens.push(_tween);
            });

            if(_tweens.length == 1){
                return _tweens[0];
            }else{
                return _tweens;
            }
        },

        to: function(){
            if(arguments.length < 3) throw 'The number of parameters is not enough!';

            var _args = objct2array(arguments);
            var _target = getElement(_args[0]);
            var _tweens = [];
            var _fromVars = _args[2];
            each(_target, function(index, obj){
                var _var0 = {};
                for(var i in _fromVars){
                    var _name = checkCssName(obj, i);
                    if(_name){
                        _var0[i] = getStyle(obj, _name);
                    }
                }

                var _tween = new tween(obj, _args[1], _var0, [_var0].concat(_args.slice(2)));
                _tweens.push(_tween);
            });

            if(_tweens.length == 1){
                return _tweens[0];
            }else{
                return _tweens;
            }
        },

        kill: function(target, end){
            var _target = getElement(target);
            each(_target, function(index, obj){
                if(obj._ct_tId){
                    tweens[obj._ct_tId].kill(end);
                }
            });
        },

        killAll: function(end){
            for(var i in tweens){
                tweens[i].kill(end);
            }
        },

        pause: function(target){
            var _target = getElement(target);
            each(_target, function(index, obj){
                if(obj._ct_tId){
                    tweens[obj._ct_tId].pause();
                }
            });
        },

        pauseAll: function(){
            for(var i in tweens){
                tweens[i].pause();
            }
        },

        play: function(target){
            var _target = getElement(target);
            each(_target, function(index, obj){
                if(obj._ct_tId){
                    tweens[obj._ct_tId].play();
                }
            });
        },

        playAll: function(){
            for(var i in tweens){
                tweens[i].play();
            }
        }

    });

    // --------------------------------------------------------------------缓动选项
    extend(CT, {
        Linear: {
            None:'(0, 0, 1, 1)'
        },
        Sine: {
            In:'(0.35, 0, 1, 1)',
            Out:'(0, 0, 0.65, 1)',
            InOut:'(0.35, 0, 0.65, 1)'
        },
        Quad: {
            In:'(0.45, 0, 1, 1)',
            Out:'(0, 0, 0.55, 1)',
            InOut:'(0.45, 0, 0.55, 1)'
        },
        Quart: {
            In:'(0.75, 0, 1, 1)',
            Out:'(0, 0, 0.25, 1)',
            InOut:'(0.75, 0, 0.25, 1)'
        },
        Expo: {
            In:'(1, 0, 1, 1)',
            Out:'(0, 0, 0, 1)',
            InOut:'(1, 0, 0, 1)'
        }
    });

    initPrefix();
    initCtStyle();

    return CT;
}));
