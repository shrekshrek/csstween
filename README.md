css tween
============

基于css3 animation的动画类库，可以方便的使用js来调用。

不过因为所有实现均基于css3 animation，所以不能像tweenmax那样使用到其他对象，只能作用于dom对象的css属性（可以查阅animation可使用的css属性）。


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

其中几个属性比较特殊:
ease设置缓动，
delay设置延时时间，
repeat设置重复次数，
yoyo设置重复时反向，
onComplete设置运动完成的返回函数，
onCompleteParams设置返回函数的参数


缓动类

CT.Linear

CT.Sine

CT.Quad

CT.Quart

CT.Expo



以上方法和参数均是参考TweenMax的方式，有使用经验者会很容易上手。