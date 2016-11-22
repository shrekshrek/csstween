/*!
 * VERSION: 0.6.0
 * DATE: 2015-12-31
 * GIT: https://github.com/shrekshrek/csstween
 * @author: Shrek.wang
 **/

(function (factory) {

    if (typeof define === 'function' && define.amd) {
        define(['exports'], function(exports) {
            window.CT = factory(exports);
        });
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        window.CT = factory({});
    }

}(function (CT) {
    // --------------------------------------------------------------------辅助方法
    function extend(obj, obj2) {
        for (var prop in obj2) {
            obj[prop] = obj2[prop];
        }
    }

    function each(obj, callback) {
        if (typeof(obj) === 'function') {
            callback.call(obj, 0, obj);
        } else if (obj.length === undefined) {
            callback.call(obj, 0, obj);
        } else {
            for (var i = 0; i < obj.length; i++) {
                callback.call(obj[i], i, obj[i]);
            }
        }
    }

    //  WebkitTransform 转 -webkit-transform
    function hyphenize(str) {
        return str.replace(/([A-Z])/g, "-$1").toLowerCase();
    }

    //  transformOrigin 转 TransformOrigin
    function firstUpper(str) {
        return str.replace(/\b(\w)|\s(\w)/g, function (m) {
            return m.toUpperCase();
        });
    }

    // --------------------------------------------------------------------检测是否支持,浏览器补全方法
    var prefix = '';

    var A_START_EVENT = 'animationstart';
    var A_REPEAT_EVENT = 'animationiteration';
    var A_END_EVENT = 'animationend';

    var T_END_EVENT = 'transitionend';

    (function () {
        var _d = document.createElement('div');
        var _prefixes = ['Webkit', 'Moz', 'Ms', 'O'];

        for (var i in _prefixes) {
            if ((_prefixes[i] + 'Transition') in _d.style) {
                prefix = _prefixes[i];
                if (prefix !== 'Moz') {
                    A_START_EVENT = prefix.toLowerCase() + 'AnimationStart';
                    A_REPEAT_EVENT = prefix.toLowerCase() + 'AnimationIteration';
                    A_END_EVENT = prefix.toLowerCase() + 'AnimationEnd';

                    T_END_EVENT = prefix.toLowerCase() + 'TransitionEnd';
                }
                break;
            }
        }
    }());

    function browserPrefix(str) {
        if (str) {
            return prefix + firstUpper(str);
        } else {
            return prefix;
        }
    }

    var requestFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame;

    // --------------------------------------------------------------------style 相关函数
    function getElement(target) {
        if (!target) throw "target is undefined, can't tween!!!";

        if (typeof(target) == 'string') {
            return (typeof(document) === 'undefined') ? target : (document.querySelectorAll ? document.querySelectorAll(target) : document.getElementById((target.charAt(0) === '#') ? target.substr(1) : target));
        } else {
            return target;
        }
    }

    function checkCssName(target, name) {
        if (target.style[name] !== undefined) return name;

        name = browserPrefix(name);
        if (target.style[name] !== undefined) return name;

        return undefined;
    }

    function calcValue(value, value2) {
        if (typeof(value2) === 'string') {
            var _s = value2.substr(0, 2);
            var _n = parseFloat(value2.substr(2));
            switch (_s) {
                case '+=':
                    value2 = parseFloat(value) + _n;
                    break;
                case '-=':
                    value2 = parseFloat(value) - _n;
                    break;
            }
        }
        return value2;
    }

    function checkCssValue(name, value) {
        switch (name) {
            case 'opacity':
            case 'fontWeight':
            case 'lineHeight':
            case 'zoom':
                return value;
            default:
                return typeof(value) === 'number' ? Math.round(value) + 'px' : value;
                break;
        }
    }

    function getStyle(target, name) {
        //if (target.style[name]) {
        //    return target.style[name];
        //} else
        if (document.defaultView && document.defaultView.getComputedStyle) {
            var _p = hyphenize(name);
            var _s = document.defaultView.getComputedStyle(target, '');
            return _s && _s.getPropertyValue(_p);
        } else if (target.currentStyle) {
            return target.currentStyle[name];
        } else {
            return null;
        }
    }

    function setStyle(target, params) {
        for (var i in params) {
            if(target.style[i] != undefined) target.style[i] = checkCssValue(i, params[i]);
        }
    }


    // --------------------------------------------------------------------css rule 相关函数
    var keyframesRule = window.CSSRule.KEYFRAMES_RULE || window.CSSRule.WEBKIT_KEYFRAMES_RULE || window.CSSRule.MOZ_KEYFRAMES_RULE;
    var styleRule = window.CSSRule.STYLE_RULE || window.CSSRule.WEBKIT_STYLE_RULE || window.CSSRule.MOZ_STYLE_RULE;
    var ctSheet;
    var ctRules;
    var ruleId = 0;

    (function () {
        var _style = document.createElement('style');
        _style.rel = 'stylesheet';
        _style.type = 'text/css';
        document.getElementsByTagName('head')[0].appendChild(_style);
        ctSheet = _style.sheet;
        ctRules = ctSheet.cssRules || ctSheet.rules || [];
    }());

    function createRuleId() {
        return ++ruleId;
    }

    function getRule(name) {
        for (var i in ctRules) {
            var _rule = ctRules[i];
            if ((_rule.type === keyframesRule && _rule.name === name) || (_rule.type === styleRule && _rule.selectorText === name)) {
                return {rule: _rule, index: i};
            }
        }
        return null;
    }

    function addRule(name, content) {
        var _index = ctRules.length;
        if (ctSheet.insertRule) {
            ctSheet.insertRule(name + '{' + content + '}', _index);
        } else if (ctSheet.addRule) {
            ctSheet.addRule(name, content, _index);
        }
    }

    function removeRule(name) {
        var _obj = getRule(name);
        if (_obj === null) return;

        if (ctSheet.deleteRule) {
            ctSheet.deleteRule(_obj.index);
        } else if (ctSheet.removeRule) {
            ctSheet.removeRule(_obj.index);
        }
    }

    function addKfsRule(name, fromVars, toVars) {
        var _name = 'ct_kfs_' + name;
        var _txt1 = '0%{';
        var _txt2 = '100%{';
        for (var i in fromVars) {
            _txt1 += hyphenize(i) + ':' + checkCssValue(i, fromVars[i]) + ';';
            _txt2 += hyphenize(i) + ':' + checkCssValue(i, toVars[i]) + ';';
        }
        _txt1 += '}';
        _txt2 += '}';
        addRule('@' + hyphenize(browserPrefix('Keyframes')) + ' ' + _name, _txt1 + _txt2);
        return _name;
    }


    // --------------------------------------------------------------------tween
    var tweens = {};
    var tweenId = 0;

    function createTweenId() {
        return ++tweenId;
    }

    function tween() {
        this.initialize.apply(this, arguments);
    }

    extend(tween.prototype, {
        initialize: function (target, time, fromVars, toVars) {
            var _self = this;

            this.fromVars = fromVars;
            this.toVars = toVars;
            this.target = target;
            this.duration = Math.max(time, 0);
            this.ease = 'cubic-bezier' + (toVars.ease || CT.Linear.None);
            this.delay = Math.max(toVars.delay || 0, 0);

            this.yoyo = toVars.yoyo || false;
            this.repeat = Math.floor(toVars.repeat || 1);
            this.onStart = toVars.onStart || null;
            this.onStartParams = toVars.onStartParams || [];
            this.onRepeat = toVars.onRepeat || null;
            this.onRepeatParams = toVars.onRepeatParams || [];
            this.onEnd = toVars.onEnd || null;
            this.onEndParams = toVars.onEndParams || [];

            this.type = toVars.type || '';

            var _tid = createTweenId();
            if (this.target._ct_id) {
                tweens[this.target._ct_id].destroy();
            }
            this.target._ct_id = _tid;

            if (this.type == 'a') {
                this.startHandler = function () {
                    if (_self.onStart) _self.onStart.apply(this, _self.onStartParams);
                };
                this.target.addEventListener(A_START_EVENT, this.startHandler, false);

                this.repeatHandler = function () {
                    if (_self.onRepeat) _self.onRepeat.apply(this, _self.onRepeatParams);
                };
                this.target.addEventListener(A_REPEAT_EVENT, this.repeatHandler, false);

                this.endHandler = function () {
                    _self.destroy(true);
                };
                this.target.addEventListener(A_END_EVENT, this.endHandler, false);

                var _rid = createRuleId();
                this.kfsName = addKfsRule(_rid, this.fromVars, this.toVars);
                this.target.style[browserPrefix('Animation')] = this.kfsName + ' ' + this.duration + 's ' + this.ease + ' ' + this.delay + 's ' + (this.repeat < 0 ? 'infinite' : this.repeat) + ' ' + (this.yoyo ? 'alternate' : 'normal');
                this.target.style[browserPrefix('AnimationFillMode')] = 'both';
                setStyle(this.target, this.toVars);
            } else {
                this.endHandler = function () {
                    _self.destroy(true);
                };
                this.target.addEventListener(T_END_EVENT, this.endHandler, false);

                requestFrame(function () {
                    requestFrame(function () {
                        _self.target.style[browserPrefix('Transition')] = 'all ' + _self.duration + 's ' + _self.ease + ' ' + _self.delay + 's';
                        setStyle(_self.target, _self.toVars);console.log(_self.target, _self.toVars);
                    });
                });
            }

            tweens[_tid] = this;
        },
        destroy: function (end) {
            if (end == false) {
                for (var i in this.toVars) {
                    if (this.target.style[i] != undefined) this.target.style[i] = getStyle(this.target, i);
                }
            }

            if (this.type == 'a') {
                this.target.removeEventListener(A_START_EVENT, this.startHandler, false);
                this.target.removeEventListener(A_REPEAT_EVENT, this.repeatHandler, false);
                this.target.removeEventListener(A_END_EVENT, this.endHandler, false);
                this.target.style[browserPrefix('Animation')] = '';
                this.target.style[browserPrefix('AnimationFillMode')] = '';
                removeRule(this.kfsName);
            } else {
                this.target.removeEventListener(T_END_EVENT, this.endHandler, false);
                this.target.style[browserPrefix('Transition')] = '';
            }

            delete tweens[this.target._ct_id];
            delete this.target._ct_id;

            if (end == true) {
                if (this.onEnd) this.onEnd.apply(this, this.onEndParams);
            }
        }
    });


    // --------------------------------------------------------------------主要方法
    extend(CT, {
        get: function (target, param) {
            var _target = getElement(target);
            if (_target.length !== undefined) {
                _target = _target[0];
            }

            var _name = checkCssName(_target, param);
            if (_name)
                return getStyle(_target, _name);
            else
                return null;
        },

        set: function (target, params) {
            var _target = getElement(target);
            each(_target, function (index, obj) {
                var _params = {};
                for (var j in params) {
                    var _name = checkCssName(obj, j);
                    if (_name) {
                        _params[_name] = checkCssValue(_name, calcValue(getStyle(obj, _name), params[j]));
                    }
                }
                setStyle(obj, _params);
            });
        },

        fromTo: function (target, time, fromVars, toVars) {
            var _target = getElement(target);
            var _tweens = [];
            each(_target, function (index, obj) {
                var _fromVars = {};
                var _toVars = {};

                for (var j in toVars) {
                    var _name = checkCssName(obj, j);
                    if (_name) {
                        var _n = getStyle(obj, _name);
                        _fromVars[_name] = calcValue(_n, fromVars[j]);
                        _toVars[_name] = calcValue(_n, toVars[j]);
                    } else {
                        _toVars[j] = toVars[j];
                    }
                }

                setStyle(obj, _fromVars);
                var _tween = new tween(obj, time, _fromVars, _toVars);
                _tweens.push(_tween);
            });

            if (_tweens.length == 1) {
                return _tweens[0];
            } else {
                return _tweens;
            }
        },

        from: function (target, time, fromVars) {
            var _target = getElement(target);
            var _tweens = [];
            each(_target, function (index, obj) {
                var _fromVars = {};
                var _toVars = {};

                for (var j in fromVars) {
                    var _name = checkCssName(obj, j);
                    if (_name) {
                        var _n = getStyle(obj, _name);
                        _toVars[_name] = _n;
                        _fromVars[_name] = calcValue(_n, fromVars[j]);
                    } else {
                        _toVars[j] = fromVars[j];
                    }
                }

                setStyle(obj, _fromVars);
                var _tween = new tween(obj, time, _fromVars, _toVars);
                _tweens.push(_tween);
            });

            if (_tweens.length == 1) {
                return _tweens[0];
            } else {
                return _tweens;
            }
        },

        to: function (target, time, toVars) {
            var _target = getElement(target);
            var _tweens = [];
            each(_target, function (index, obj) {
                var _fromVars = {};
                var _toVars = {};

                for (var j in toVars) {
                    var _name = checkCssName(obj, j);
                    if (_name) {
                        var _n = getStyle(obj, _name);
                        _fromVars[_name] = _n;
                        _toVars[_name] = calcValue(_n, toVars[j]);
                    } else {
                        _toVars[j] = toVars[j];
                    }
                }

                var _tween = new tween(obj, time, _fromVars, _toVars);
                _tweens.push(_tween);
            });

            if (_tweens.length == 1) {
                return _tweens[0];
            } else {
                return _tweens;
            }
        },

        kill: function (target, end) {
            var _target = getElement(target);
            each(_target, function (index, obj) {
                if (obj._ct_id) {
                    tweens[obj._ct_id].destroy(end);
                }
            });
        },

        killAll: function (end) {
            for (var i in tweens) {
                tweens[i].destroy(end);
            }
        }

    });

    // --------------------------------------------------------------------缓动选项
    extend(CT, {
        Linear: {
            None: '(0, 0, 1, 1)'
        },
        Quad: {
            In: '(0.3, 0, 0.65, 0.75)',
            Out: '(0.35, 0.25, 0.7, 1)',
            InOut: '(0.46, 0.03, 0.54, 0.97)'
        },
        Quart: {
            In: '(0.5, 0, 0.75, 0)',
            Out: '(0.25, 1, 0.5, 1)',
            InOut: '(0.75, 0, 0.25, 1)'
        },
        Back: {
            In: '(0, 0.35, 0.7, -0.6)',
            Out: '(0.3, 1.6, 0.65, 1)'
        }
    });

    return CT;
}));
