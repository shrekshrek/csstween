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
        dynamicSheet:null,
        init:function(){
            var style = document.createElement('style');
            style.rel = 'stylesheet';
            style.type = 'text/css';
            document.getElementsByTagName('head')[0].appendChild(style);
            this.dynamicSheet = style.sheet;
        },

        findKeyframeRules: function(){
            var rules = styles.cssRules || styles.rules || [];

            for(var i=0; i<rules.length; i++) {
                var rule = rules[i];

                if(rule.type == CSSRule.IMPORT_RULE) {
                    CssTween.findKeyframeRules(rule.styleSheet, func);
                }
                else if(rule.type === CSSRule.KEYFRAMES_RULE ||
                    rule.type === CSSRule.MOZ_KEYFRAMES_RULE ||
                    rule.type === CSSRule.WEBKIT_KEYFRAMES_RULE) {
                    func(rule, styles, i);
                }
            }
        },

        from: function(){

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

            var _self = this;
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
                        dom.addEventListener('transitionend', function(){
                            dom.style[_self._browserPrefix + "Transition"] = '';
                            params[i]();
                        }, false);
                        break;
                }
            }

            dom.style[this._browserPrefix + "Transition"] = 'all ' + _duration + ' ' + _ease + ' ' + _delay;

            setTimeout(function(){
                for(var i in params){
                    switch(i){
                        case "ease":
                        case "delay":
                        case 'onComplete':
                            break;
                        default:
                            dom.style[i] = params[i];
                            break;
                    }
                }
            }, 0);
        },

        fromTo: function(){

        }
    });


    return CssTween;
}));
