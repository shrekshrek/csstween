css tween
============

基于css3 animation和transition的动画类库，可以方便的使用js来调用。

不过因为所有实现均基于css3，所以不能像tweenmax那样使用到其他对象，只能作用于dom对象的css属性（可以查阅animation和transition可使用的css属性）。


demo:  
http://shrek.imdevsh.com/demo/performance/test1/csstween.html  
http://shrek.imdevsh.com/demo/performance/test2/csstween.html  


API
============

CT.get(target, param);

CT.set(target, params);

CT.fromTo(target, duration, fromParams, toParams);

CT.from(target, duration, fromParams);

CT.to(target, duration, toParams);

CT.kill(target);

CT.killAll();

param为字符串，  
Params为数组，  

以下是所有配置属性:  
type设置为'a'使用animation,不设置则使用transition(transiton动画的创建效率高于animation,但没有animation那样丰富的功能和回调)  
ease设置缓动，  
delay设置延时时间，  
onEnd设置运动完成的返回函数，  
onEndParams设置返回函数的参数，  

只有当type:'a'时以下属性才能起作用  
repeat设置重复次数，  
yoyo设置重复时反向，  
onStart设置运动开始的返回函数，  
onStartParams设置开始返回函数的参数，  
onRepeat设置运动循环中每个运动完成的返回函数，  
onRepeatParams设置运动完成返回函数的参数，  


缓动类

CT.Linear

CT.Quad

CT.Quart

CT.Back

除了CT.Linear只有None一项，其他均有In,InOut,Out三项选择。


以上方法和参数均是参考TweenMax的方式，有使用经验者会很容易上手。


